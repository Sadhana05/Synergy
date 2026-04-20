import threading
import time
from datetime import datetime, timezone
from bson import ObjectId
from db import agents_collection, executions_collection, drafts_collection, token_usage_collection, api_keys_collection
from services.lcm_planner import LCMPlanner
from services.moe_router import MOERouter
from services.slm_executor import SLMExecutor
from services.oauth_service import OAuthService, LinkedInOAuthService
from services.email_tools import EmailTools
from services.linkedin_tools import LinkedInTools
from services.email_automation_agent import EmailAutomationAgent
from services.execution_validator import ExecutionValidator
from services.direct_scraper import DirectScraper
import json

class AgentRunner:
    def __init__(self):
        self.moe = MOERouter()
        self.oauth = OAuthService()
        self.linkedin_oauth = LinkedInOAuthService()
        self.email = EmailTools()

    def get_user_groq_key(self, user_id: str) -> str:
        """Fetch user's GROQ API key from database"""
        api_key_doc = api_keys_collection.find_one({"user_id": ObjectId(user_id)})
        if not api_key_doc or not api_key_doc.get("groq_api_key"):
            return None
        return api_key_doc["groq_api_key"]

    def log_execution(self, agent_id: str, user_id: str, step_name: str, status: str, result: str = None, error: str = None):
        """Helper to log execution steps to MongoDB."""
        executions_collection.insert_one({
            "agent_id": ObjectId(agent_id),
            "user_id": ObjectId(user_id),
            "step": step_name,
            "status": status,
            "result": result,
            "error": error,
            "timestamp": datetime.now(timezone.utc)
        })

    def log_token_usage(self, user_id: str, model: str, prompt_tokens: int, completion_tokens: int):
        """Helper to track token usage for monitoring."""
        token_usage_collection.insert_one({
            "user_id": ObjectId(user_id),
            "model": model,
            "prompt_tokens": prompt_tokens,
            "completion_tokens": completion_tokens,
            "total_tokens": prompt_tokens + completion_tokens,
            "timestamp": datetime.now(timezone.utc)
        })

    def run_agent_sync(self, agent_id: str):
        """
        Orchestrates the full agent execution pipeline.
        """
        agent = agents_collection.find_one({"_id": ObjectId(agent_id)})
        if not agent:
            return
            
        user_id = str(agent["user_id"])
        goal = agent["goal"]

        from db import users_collection
        user = users_collection.find_one({"_id": ObjectId(user_id)})
        if not user:
            agents_collection.update_one({"_id": ObjectId(agent_id)}, {"$set": {"status": "error"}})
            return
        
        try:
            # 1. Get user's GROQ API key
            groq_api_key = self.get_user_groq_key(user_id)
            if not groq_api_key:
                self.log_execution(agent_id, user_id, "API Key Check", "error", error="GROQ API key not configured. Please set it in System Config.")
                agents_collection.update_one({"_id": ObjectId(agent_id)}, {"$set": {"status": "error"}})
                return

            # 2. LCM Planning - pass API key
            self.log_execution(agent_id, user_id, "Planning", "in_progress")
            lcm = LCMPlanner(api_key=groq_api_key)
            plan = lcm.generate_plan(goal)
            if "error" in plan:
                self.log_execution(agent_id, user_id, "Planning", "error", error=plan["error"])
                agents_collection.update_one({"_id": ObjectId(agent_id)}, {"$set": {"status": "error"}})
                return
            
            # 3. MOE Routing
            plan = self.moe.route_plan(plan)
            self.log_execution(agent_id, user_id, "Planning", "success", result=f"Plan generated with {len(plan['steps'])} steps.")

            # Calculate required tokens based on task complexity
            steps_count = len(plan["steps"])
            required_tokens = 900 if steps_count > 7 else (400 if steps_count >= 4 else 150)

            # Enforce daily execution limits for "Free" plan
            if user.get("plan", "Starter") == "Free":
                today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
                today_executions = executions_collection.count_documents({
                    "user_id": ObjectId(user_id),
                    "step": "Planning",
                    "status": "in_progress",
                    "timestamp": {"$gte": today_start}
                })
                daily_limit = user.get("daily_execution_limit", 5)
                # Since log_execution for Planning "in_progress" was already called just above (step 2),
                # today_executions includes the current run. So we check strictly > daily_limit
                if today_executions > daily_limit:
                    msg = f"Daily execution limit ({daily_limit}) reached for Free plan. Please upgrade or try again tomorrow."
                    self.log_execution(agent_id, user_id, "Usage Check", "error", error=msg)
                    agents_collection.update_one({"_id": ObjectId(agent_id)}, {"$set": {"status": "error", "error_message": msg}})
                    return

            # Check limits and initialize if missing (for older OAuth users)
            executions_remaining = user.get("executions_remaining")
            tokens_remaining = user.get("tokens_remaining")
            
            if executions_remaining is None or tokens_remaining is None:
                executions_remaining = user.get("monthly_execution_limit", 10000)
                tokens_remaining = user.get("monthly_token_limit", 2000000)
                users_collection.update_one(
                    {"_id": ObjectId(user_id)},
                    {"$set": {
                        "executions_remaining": executions_remaining,
                        "tokens_remaining": tokens_remaining,
                        "monthly_execution_limit": user.get("monthly_execution_limit", 10000),
                        "monthly_token_limit": user.get("monthly_token_limit", 2000000),
                        "agent_creation_limit": user.get("agent_creation_limit", 500),
                        "plan": user.get("plan", "Starter")
                    }}
                )

            if executions_remaining < 1 or tokens_remaining < required_tokens:
                msg = "Usage limit reached. Please upgrade your plan or purchase token top-ups."
                self.log_execution(agent_id, user_id, "Usage Check", "error", error=msg)
                agents_collection.update_one({"_id": ObjectId(agent_id)}, {"$set": {"status": "error", "error_message": msg}})
                return
            
            # Deduct usage early (or after, but doing it here prevents concurrent race conditions allowing >1 runs if fast)
            # Actually, doing it after is safer so they don't pay for failed agent starts, but doing it here ensures strict checks.
            # We'll do it here.
            users_collection.update_one(
                {"_id": ObjectId(user_id)},
                {"$inc": {"executions_remaining": -1, "tokens_remaining": -required_tokens}}
            )

            # 4. Check OAuth based on plan content
            needs_linkedin = any(step["action"].startswith("linkedin_") for step in plan["steps"])
            needs_google = any(step["action"].startswith("email_") or step["action"].startswith("gmail_") for step in plan["steps"])
            
            creds = None
            linkedin_tools = None

            if needs_linkedin:
                linkedin_creds = self.linkedin_oauth.get_credentials(user_id)
                if not linkedin_creds:
                    self.log_execution(agent_id, user_id, "LinkedIn OAuth Check", "error", error="Missing or expired LinkedIn OAuth tokens.")
                    agents_collection.update_one({"_id": ObjectId(agent_id)}, {"$set": {"status": "error"}})
                    users_collection.update_one({"_id": ObjectId(user_id)}, {"$inc": {"executions_remaining": 1, "tokens_remaining": required_tokens}})
                    return
                linkedin_tools = LinkedInTools(linkedin_creds["access_token"])
            
            if needs_google:
                creds = self.oauth.get_credentials(user_id)
                if not creds:
                    self.log_execution(agent_id, user_id, "Gmail OAuth Check", "error", error="Missing or expired Google OAuth tokens.")
                    agents_collection.update_one({"_id": ObjectId(agent_id)}, {"$set": {"status": "error"}})
                    users_collection.update_one({"_id": ObjectId(user_id)}, {"$inc": {"executions_remaining": 1, "tokens_remaining": required_tokens}})
                    return

            # 5. SLM Execution
            slm = SLMExecutor(api_key=groq_api_key)
            context = {"steps": {}} # Store step results here
            
            for step in plan["steps"]:
                # Abort check
                current_agent = agents_collection.find_one({"_id": ObjectId(agent_id)})
                if not current_agent or current_agent.get("status") in ["stopped"]:
                    self.log_execution(agent_id, user_id, "System", "error", error="Agent execution stopped by user command.")
                    agents_collection.update_one({"_id": ObjectId(agent_id)}, {"$set": {"status": "stopped", "last_run": datetime.now(timezone.utc)}})
                    return

                step_desc = step['description']
                action = step['action']
                params = step.get('parameters', {})
                self.log_execution(agent_id, user_id, f"Step: {step_desc}", "in_progress")
                
                # PRE-EXECUTION TOOL CALLS (Fetching data)
                if step["action"] == "email_classification":
                    emails = self.email.get_unread_emails(creds)
                    context["emails"] = emails
                    step["parameters"]["email_summaries"] = [{"id": e["id"], "subject": e["subject"], "from": e["from"], "snippet": e["snippet"]} for e in emails]
                
                elif action == "linkedin_connection_intelligence" or action == "linkedin_job_search" or action == "linkedin_post_search":
                    query = params.get("query") or params.get("job_title") or params.get("keyword") or goal
                    is_post_search = action == "linkedin_post_search" or ("post" in query.lower() and "job" not in query.lower())
                    
                    search_results = []
                    
                    # NEW: API Limitation Check - Personal Connections
                    personal_data_request = any(k in query.lower() for k in ["my connections", "connections i haven't", "message history", "my inbox", "who i messaged"])
                    
                    # ATTEMPT REAL-TIME API FETCH FIRST
                    if action == "linkedin_connection_intelligence":
                        self.log_execution(agent_id, user_id, "LinkedIn Action", "in_progress", result="Attempting Real-Time Connection Request fetch via API...")
                        reqs = linkedin_tools.get_connection_requests()
                        if isinstance(reqs, dict) and reqs.get("status") == "api_error":
                            self.log_execution(agent_id, user_id, "LinkedIn Action", "error", error=f"REAL-TIME API RESTRICTION: LinkedIn returned {reqs['code']} for Connection Requests.")
                        else:
                            context["connection_requests"] = reqs
                            self.log_execution(agent_id, user_id, "LinkedIn Action", "success", result=f"Fetched {len(reqs)} connection requests from API.")
                    
                    elif action == "linkedin_job_search":
                        self.log_execution(agent_id, user_id, "LinkedIn Action", "in_progress", result="Checking LinkedIn Job API status...")
                        job_res = linkedin_tools.search_jobs(query)
                        if isinstance(job_res, dict) and job_res.get("status") == "api_restricted":
                            # This is the expected state for standard members
                            self.log_execution(agent_id, user_id, "LinkedIn Action", "in_progress", result="Job API restricted (Standard Tier). Pivoting to Web Search Discovery...")
                            # search_results remains empty, triggering the fallback below
                        elif isinstance(job_res, list):
                            search_results = job_res
                            self.log_execution(agent_id, user_id, "LinkedIn Action", "success", result=f"Found {len(search_results)} jobs via direct API.")

                    if personal_data_request:
                        notice = "NOTICE: The LinkedIn API restricts access to private connection lists. I will continue by searching for public profile data instead."
                        self.log_execution(agent_id, user_id, "LinkedIn Action", "in_progress", result=notice)
                        context["linkedin_restriction"] = notice
                        # We NO LONGER set CRITICAL_DATA_WARNING here, as we want to find PUBLIC fallback data
                        # Only set it as a last resort if search itself fails.
                        recent_post = executions_collection.find_one({
                            "user_id": ObjectId(user_id),
                            "step": "LinkedIn Action",
                            "status": "success",
                            "result": {"$regex": "LinkedIn Post published! ID:"}
                        }, sort=[("timestamp", -1)])
                        
                        if recent_post:
                            post_id = recent_post["result"].split("ID: ")[1].strip()
                            search_results.append({
                                "title": "Recently Published Post (Internal Recall)",
                                "link": f"https://www.linkedin.com/feed/update/{post_id}",
                                "snippet": f"This post was recently published by you via the AI Agent. ID: {post_id}",
                                "type": "post",
                                "is_post": True,
                                "source": "internal_logs"
                            })
                            self.log_execution(agent_id, user_id, "LinkedIn Action", "success", result="Found your recently published post in internal logs.")

                    # ENHANCEMENT: If looking for "my" or "user" posts, get the real name
                    if is_post_search and any(k in query.lower() for k in ["my", "user", "recent"]):
                        try:
                            profile = linkedin_tools.get_profile()
                            name = profile.get("name") or profile.get("localizedFirstName", "") + " " + profile.get("localizedLastName", "")
                            if name.strip() and name.lower() not in query.lower():
                                query = f"{name} posts"
                                self.log_execution(agent_id, user_id, "LinkedIn Action", "in_progress", result=f"Enriched search identifying user: {name}")
                        except:
                            pass

                    if not search_results:
                        search_type = "posts" if is_post_search else ("profile_search" if action == "linkedin_connection_intelligence" else "jobs")
                        self.log_execution(agent_id, user_id, "LinkedIn Action", "in_progress", result=f"Searching LinkedIn for {search_type.replace('_', ' ')}: {query}...")
                        search_results = self.perform_web_search(query, search_type=search_type)
                    
                    self.log_execution(agent_id, user_id, "LinkedIn Action", "success", result=f"DATA DISCOVERY: Found {len(search_results)} valid professional results in search index.")
                    
                    if not search_results:
                        context["LINKEDIN_DATA_WARNING"] = "ZERO RESULTS FOUND FOR LINKEDIN SEARCH. DO NOT GENERATE FICTIONAL LINKEDIN DATA. Mention that the LinkedIn search returned no results."
                        # Also search for the user's own profile as a fallback to at least show something
                        try:
                            profile = linkedin_tools.get_profile()
                            context["user_profile"] = profile
                        except:
                            pass
                        # Secondary attempt: Find the profile itself
                        self.log_execution(agent_id, user_id, "LinkedIn Action", "in_progress", result="Posts not found. Searching for public profile instead...")
                        profile_results = self.perform_web_search(f"{query} profile", search_type="profile_search")
                        if profile_results:
                            search_results = profile_results
                            self.log_execution(agent_id, user_id, "LinkedIn Action", "success", result="Found profile link as fallback.")

                    if is_post_search:
                        context["linkedin_posts"] = search_results
                        step["parameters"]["post_results"] = search_results
                        if not search_results:
                            context["error"] = "No LinkedIn posts or public profile were found. Please check your LinkedIn public visibility settings."
                    else:
                        context["linkedin_results"] = search_results
                        step["parameters"]["job_postings"] = search_results
                        step["parameters"]["request_summaries"] = search_results
                        
                elif action == "web_search":
                    query = params.get("query") or goal
                    self.log_execution(agent_id, user_id, "Web Search", "in_progress", result=f"Searching for: {query} via direct scraping...")
                    scraper = DirectScraper()
                    results = scraper.discover_all(query, search_type="people")
                    self.log_execution(agent_id, user_id, "Web Search", "success", result=f"Found {len(results)} results via direct scraping.")
                    context["web_search_results"] = results
                    step["parameters"]["search_results"] = results

                elif action == "linkedin_message_workflow" or action == "linkedin_message_send":
                    self.log_execution(agent_id, user_id, "LinkedIn Action", "in_progress", result="Accessing LinkedIn Messaging API...")
                    messages = linkedin_tools.get_messages()
                    if isinstance(messages, dict) and messages.get("status") == "api_error":
                        err_msg = f"REAL-TIME API ERROR: LinkedIn returned {messages['code']} for messaging history. This permission is restricted to official partners."
                        self.log_execution(agent_id, user_id, "LinkedIn Action", "error", error=err_msg)
                        context["linkedin_messages"] = []
                        context["api_restriction_notice"] = err_msg
                    else:
                        context["linkedin_messages"] = messages
                        step["parameters"]["message_summaries"] = messages

                # Execute via SLM to get the content
                result = slm.execute_step(step, context)
                self.log_token_usage(user_id, step.get("slm_model", "llama-3.1-8b-instant"), 500, 200)

                if result["status"] == "error":
                    self.log_execution(agent_id, user_id, f"Step: {step_desc}", "error", error=result["error"])
                    agents_collection.update_one({"_id": ObjectId(agent_id)}, {"$set": {"status": "error"}})
                    return
                
                # POST-EXECUTION TOOL CALLS (Actions)
                action = step["action"]
                params = step.get("parameters", {})
                content = result["result"]
                
                clean_content = content
                try:
                    # Try to parse as JSON if it looks like it
                    if content.strip().startswith("{") or content.strip().startswith("["):
                        data = json.loads(content)
                        if isinstance(data, dict):
                            # Look for common keys in nested structures
                            def find_content(obj):
                                if not isinstance(obj, dict): return None
                                # Priority keys
                                for key in ["post_content", "email_content", "body", "message", "text", "content", "result"]:
                                    if key in obj and isinstance(obj[key], str):
                                        return obj[key]
                                # Check nested objects (like {"linkedin_post": {"post_content": "..."}})
                                for key in obj:
                                    if isinstance(obj[key], dict):
                                        res = find_content(obj[key])
                                        if res: return res
                                return None
                            
                            found = find_content(data)
                            if found:
                                clean_content = found
                except:
                    pass

                context["steps"][step_desc] = clean_content

                if action == "email_drafting":
                    import re
                    def find_email(text):
                        matches = re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', text)
                        return matches[0] if matches else None
                    to = params.get("to") or find_email(goal) or find_email(clean_content)
                    if to:
                        self.log_execution(agent_id, user_id, "Tool Execution", "in_progress", result=f"Creating Gmail draft for {to}...")
                        draft = self.email.create_draft(creds, to, params.get("subject", "Automated Draft"), clean_content)
                        self.log_execution(agent_id, user_id, "Tool Execution", "success", result=f"Gmail Draft created! ID: {draft.get('id')}")
                    else:
                        self.log_execution(agent_id, user_id, "Tool Execution", "error", error="Could not identify recipient for draft.")

                elif action == "email_sending":
                    import re
                    def find_email(text):
                        matches = re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', text)
                        return matches[0] if matches else None
                    to = params.get("to") or find_email(goal) or find_email(clean_content)
                    if to:
                        self.log_execution(agent_id, user_id, "Tool Execution", "in_progress", result=f"Sending Gmail to {to}...")
                        send_result = self.email.send_email(creds, to, params.get("subject", "Automated Email"), clean_content)
                        # STRICT REAL EXECUTION: validate the API actually sent the email
                        receipt = ExecutionValidator.validate_email_sent(send_result)
                        if receipt.get("status") == "completed":
                            email_id = receipt["verifiable_reference"].get("email_id", "unknown")
                            self.log_execution(agent_id, user_id, "Tool Execution", "success",
                                result=f"Email sent. Verifiable email_id: {email_id}")
                        else:
                            self.log_execution(agent_id, user_id, "Tool Execution", "error",
                                error=f"EXECUTION_ERROR: {receipt.get('error_reason')} — {receipt.get('detail')}")
                    else:
                        self.log_execution(agent_id, user_id, "Tool Execution", "error", error="Could not identify recipient for email.")

                elif action == "linkedin_message_workflow" or action == "linkedin_message_send":
                    # For LinkedIn, workflow usually means DRAFTING first (approval-based)
                    self.log_execution(agent_id, user_id, "LinkedIn Action", "in_progress", result="Creating LinkedIn message draft...")
                    draft_id = linkedin_tools.create_draft(user_id, params.get("recipient_id", "unknown"), clean_content, "message_send")
                    self.log_execution(agent_id, user_id, "LinkedIn Action", "success", result=f"LinkedIn Message Draft created! ID: {draft_id}")

                elif action == "linkedin_connection_request":
                    self.log_execution(agent_id, user_id, "LinkedIn Action", "in_progress", result="Drafting connection request...")
                    draft_id = linkedin_tools.create_draft(user_id, params.get("profile_id", "unknown"), clean_content, "connection_request")
                    success_msg = f"Connection Request Draft created! ID: {draft_id}. Review and send it from your LinkedIn Workspace Approval Queue."
                    self.log_execution(agent_id, user_id, "LinkedIn Action", "success", result=success_msg)
                    result["result"] = f"{clean_content}\n\n(Draft created in LinkedIn Workspace Approval Queue)"

                elif action == "linkedin_resume_job_match":
                    self.log_execution(agent_id, user_id, "LinkedIn Action", "in_progress", result="Matching resume against jobs...")
                    # This is reasoning by SLM, results are in context. No tool call needed here but we log.

                elif action == "linkedin_job_apply":
                    self.log_execution(agent_id, user_id, "LinkedIn Action", "in_progress", result="Initiating job application...")
                    # Signaling for manual approval/browser trigger
                    draft_id = linkedin_tools.create_draft(user_id, params.get("job_id", "unknown"), clean_content, "job_application")
                    self.log_execution(agent_id, user_id, "LinkedIn Action", "success", result=f"Application task created in queue! ID: {draft_id}")

                elif action == "linkedin_lead_tracking":
                    self.log_execution(agent_id, user_id, "LinkedIn Action", "in_progress", result="Saving LinkedIn lead...")
                    lead_id = linkedin_tools.save_lead(user_id, {"profile_data": params.get("profile_data"), "score": params.get("score", 50), "analysis": clean_content})
                    self.log_execution(agent_id, user_id, "LinkedIn Action", "success", result=f"Lead saved/updated! ID: {lead_id}")

                elif action == "linkedin_post_automation":
                    self.log_execution(agent_id, user_id, "LinkedIn Action", "in_progress", result="Publishing LinkedIn post...")
                    # Get profile to find author URN
                    profile = linkedin_tools.get_profile()
                    author_id = profile.get("sub") or profile.get("id")
                    
                    if not author_id:
                        self.log_execution(agent_id, user_id, "LinkedIn Action", "error", error="Failed to fetch LinkedIn profile ID.")
                        continue
                        
                    # Ensure it's a properly formatted URN
                    author_urn = author_id if author_id.startswith("urn:li:") else f"urn:li:person:{author_id}"
                    
                    result = linkedin_tools.create_post(author_urn, clean_content)
                    if result["status"] == "success":
                        self.log_execution(agent_id, user_id, "LinkedIn Action", "success", result=f"LinkedIn Post published! ID: {result.get('post_id')}")
                    else:
                        self.log_execution(agent_id, user_id, "LinkedIn Action", "error", error=f"Failed to publish post: {result.get('error')}")

                elif action == "database_save":
                    self.log_execution(agent_id, user_id, "Tool Execution", "in_progress", result="Saving result to database...")
                    from db import db
                    data_to_store = clean_content
                    try:
                        # Try to parse current content as JSON
                        data_to_store = json.loads(clean_content)
                    except:
                        # If the SLM just replied with a generic success text instead of data, fall back to the context
                        if "successfully" in clean_content.lower() or "saved" in clean_content.lower() or len(clean_content) < 150:
                            # We want to store the actual data from previous steps, not just "It's saved"
                            step_keys = list(context["steps"].keys())
                            if len(step_keys) > 1:
                                # Get the step exactly before this database_save step
                                previous_step_name = step_keys[-2]
                                data_to_store = context["steps"][previous_step_name]
                                
                                # If the previous step was a string, let's keep the whole context to be safe so we don't lose the JSON
                                if isinstance(data_to_store, str) and not (data_to_store.strip().startswith("{") or data_to_store.strip().startswith("[")):
                                     # Just save all accumulated steps to ensure no data loss
                                     data_to_store = context["steps"]
                            else:
                                data_to_store = context["steps"]
                                
                    db.agent_results.insert_one({
                        "agent_id": ObjectId(agent_id),
                        "user_id": ObjectId(user_id),
                        "step": step_desc,
                        "data": data_to_store,
                        "timestamp": datetime.now(timezone.utc)
                    })
                    # STRICT REAL EXECUTION: validate MongoDB actually inserted with a real record ID
                    from db import db as db_conn
                    insert_result = db_conn.agent_results.find_one(
                        {"agent_id": ObjectId(agent_id), "step": step_desc},
                        sort=[("timestamp", -1)]
                    )
                    if insert_result and insert_result.get("_id"):
                        self.log_execution(agent_id, user_id, "Tool Execution", "success",
                            result=f"Data persisted. Verifiable database_record_id: {str(insert_result['_id'])}")
                    else:
                        self.log_execution(agent_id, user_id, "Tool Execution", "error",
                            error="EXECUTION_ERROR: database_record_creation failed — no inserted_id returned.")

                elif action == "email_automation_process":
                    self.log_execution(agent_id, user_id, "Email Automation", "in_progress", result="Processing inbox with full Email Automation Agent...")
                    try:
                        email_agent = EmailAutomationAgent(user_id=user_id, groq_api_key=groq_api_key)
                        automation_result = email_agent.process_inbox(creds, max_emails=params.get("max_emails", 10))
                        context["email_automation_result"] = automation_result.get("stats", {})
                        self.log_execution(agent_id, user_id, "Email Automation", "success",
                            result=f"Processed {automation_result['stats']['total_processed']} emails. "
                                   f"Tasks: {automation_result['stats']['tasks_created']}, "
                                   f"Leads: {automation_result['stats']['leads_detected']}, "
                                   f"Replies: {automation_result['stats']['replies_sent']}")
                    except Exception as ea:
                        self.log_execution(agent_id, user_id, "Email Automation", "error", error=str(ea))

                elif action == "email_task_extraction":
                    self.log_execution(agent_id, user_id, "Email Automation", "in_progress", result="Extracting tasks from emails...")
                    try:
                        email_agent = EmailAutomationAgent(user_id=user_id, groq_api_key=groq_api_key)
                        automation_result = email_agent.process_inbox(creds, max_emails=params.get("max_emails", 5))
                        tasks_created = automation_result["stats"].get("tasks_created", 0)
                        self.log_execution(agent_id, user_id, "Email Automation", "success",
                            result=f"Extracted {tasks_created} tasks from inbox.")
                    except Exception as ea:
                        self.log_execution(agent_id, user_id, "Email Automation", "error", error=str(ea))

                elif action == "email_lead_detection":
                    self.log_execution(agent_id, user_id, "Email Automation", "in_progress", result="Detecting leads from emails...")
                    try:
                        email_agent = EmailAutomationAgent(user_id=user_id, groq_api_key=groq_api_key)
                        automation_result = email_agent.process_inbox(creds, max_emails=params.get("max_emails", 10))
                        leads_detected = automation_result["stats"].get("leads_detected", 0)
                        self.log_execution(agent_id, user_id, "Email Automation", "success",
                            result=f"Detected {leads_detected} leads from inbox.")
                    except Exception as ea:
                        self.log_execution(agent_id, user_id, "Email Automation", "error", error=str(ea))

                elif action == "email_daily_digest":
                    self.log_execution(agent_id, user_id, "Email Automation", "in_progress", result="Generating daily email digest...")
                    try:
                        email_agent = EmailAutomationAgent(user_id=user_id, groq_api_key=groq_api_key)
                        digest = email_agent.generate_daily_digest()
                        context["daily_digest"] = digest
                        self.log_execution(agent_id, user_id, "Email Automation", "success",
                            result=f"Daily digest: {digest['total_emails_processed']} emails, "
                                   f"{digest['tasks_created']} tasks, {digest['leads_detected']} leads")
                    except Exception as ea:
                        self.log_execution(agent_id, user_id, "Email Automation", "error", error=str(ea))

                elif action == "email_attachment_processing":
                    self.log_execution(agent_id, user_id, "Email Automation", "in_progress", result="Processing email attachments...")
                    try:
                        msg_id = params.get("message_id") or context.get("email_id")
                        if creds and msg_id:
                            attachments = self.email.get_attachments(creds, msg_id)
                            context["attachments"] = [{"filename": a["filename"], "mimeType": a["mimeType"], "size": a["size"]} for a in attachments]
                            self.log_execution(agent_id, user_id, "Email Automation", "success",
                                result=f"{len(attachments)} attachment(s) processed: {', '.join(a['filename'] for a in attachments)}")
                        else:
                            self.log_execution(agent_id, user_id, "Email Automation", "error", error="EXECUTION_ERROR: message_id required for attachment processing.")
                    except Exception as ea:
                        self.log_execution(agent_id, user_id, "Email Automation", "error", error=str(ea))

                elif action == "email_spam_detection":
                    self.log_execution(agent_id, user_id, "Email Automation", "in_progress", result="Analyzing email for spam/phishing patterns...")
                    self.log_execution(agent_id, user_id, "Email Automation", "success", result=f"Spam analysis complete: {clean_content[:200]}")

                elif action == "email_priority_detection":
                    self.log_execution(agent_id, user_id, "Email Automation", "in_progress", result="Detecting urgency level...")
                    urgency_keywords = ["urgent", "asap", "critical", "immediately", "emergency"]
                    body_lower = (params.get("body", "") + clean_content).lower()
                    is_urgent = any(kw in body_lower for kw in urgency_keywords)
                    context["urgency"] = "High" if is_urgent else "Low"
                    self.log_execution(agent_id, user_id, "Email Automation", "success",
                        result=f"Priority: {'HIGH — admin notification triggered' if is_urgent else 'Normal'}")

                elif action == "email_meeting_detection":
                    self.log_execution(agent_id, user_id, "Email Automation", "in_progress", result="Extracting meeting details...")
                    context["meeting_details"] = clean_content
                    self.log_execution(agent_id, user_id, "Email Automation", "success", result=f"Meeting details extracted: {clean_content[:200]}")

                elif action == "email_data_extraction":
                    self.log_execution(agent_id, user_id, "Email Automation", "in_progress", result="Extracting structured data fields...")
                    context["extracted_data"] = clean_content
                    self.log_execution(agent_id, user_id, "Email Automation", "success", result=f"Data extracted: {clean_content[:300]}")

                elif action == "email_workflow_trigger":
                    self.log_execution(agent_id, user_id, "Email Automation", "in_progress", result="Checking email subject for workflow triggers...")
                    subject = params.get("subject", "").upper()
                    trigger_map = {"RUN REPORT": "generate_report", "CREATE TASK": "project_task_create", "DATA REQUEST": "email_data_extraction"}
                    triggered = next((v for k, v in trigger_map.items() if k in subject), None)
                    if triggered:
                        context["workflow_trigger"] = triggered
                        self.log_execution(agent_id, user_id, "Email Automation", "success", result=f"Workflow triggered: {triggered}")
                    else:
                        self.log_execution(agent_id, user_id, "Email Automation", "success", result="No workflow trigger keyword found in subject.")

                elif action == "email_follow_up_automation":
                    self.log_execution(agent_id, user_id, "Email Automation", "in_progress", result="Scheduling follow-up tracking...")
                    try:
                        email_agent = EmailAutomationAgent(user_id=user_id, groq_api_key=groq_api_key)
                        email_data = {
                            "id": params.get("message_id"),
                            "threadId": params.get("thread_id"),
                            "subject": params.get("subject", "Follow-up"),
                            "from": params.get("to", "")
                        }
                        email_agent._schedule_followup(email_data)
                        self.log_execution(agent_id, user_id, "Email Automation", "success", result="Follow-up scheduled for 48 hours.")
                    except Exception as ea:
                        self.log_execution(agent_id, user_id, "Email Automation", "error", error=str(ea))

                elif action == "project_task_create":
                    self.log_execution(agent_id, user_id, "Task Creation", "in_progress", result="Creating task record...")
                    try:
                        from db import email_tasks_collection
                        task_doc = {
                            "user_id": ObjectId(user_id),
                            "task_title": params.get("title") or "Task from Agent",
                            "task_description": params.get("description") or clean_content[:500],
                            "priority": params.get("priority") or context.get("urgency", "Medium"),
                            "deadline": params.get("deadline"),
                            "status": "pending",
                            "source": "agent_runner",
                            "created_at": datetime.now(timezone.utc)
                        }
                        ins = email_tasks_collection.insert_one(task_doc)
                        self.log_execution(agent_id, user_id, "Task Creation", "success", result=f"Task created. Verifiable task_id: {str(ins.inserted_id)}")
                    except Exception as ea:
                        self.log_execution(agent_id, user_id, "Task Creation", "error", error=str(ea))

                elif action == "send_notification":
                    self.log_execution(agent_id, user_id, "Notification", "in_progress", result="Sending admin notification...")
                    try:
                        from db import users_collection
                        admin = users_collection.find_one({"role": "admin"})
                        if admin and creds:
                            notification_body = f"AutoAgent Alert\n\n{params.get('message') or clean_content}"
                            send_result = self.email.send_email(creds, admin.get("email"), "[AutoAgent] System Notification", notification_body)
                            receipt = ExecutionValidator.validate_email_sent(send_result)
                            if receipt.get("status") == "completed":
                                self.log_execution(agent_id, user_id, "Notification", "success",
                                    result=f"Admin notified. email_id: {receipt['verifiable_reference'].get('email_id')}")
                            else:
                                self.log_execution(agent_id, user_id, "Notification", "error", error=receipt.get("error_reason"))
                        else:
                            self.log_execution(agent_id, user_id, "Notification", "error", error="EXECUTION_ERROR: No admin account or OAuth not connected.")
                    except Exception as ea:
                        self.log_execution(agent_id, user_id, "Notification", "error", error=str(ea))

                elif action == "generate_report":
                    self.log_execution(agent_id, user_id, "Reporting", "in_progress", result="Generating operational report...")
                    try:
                        email_agent = EmailAutomationAgent(user_id=user_id, groq_api_key=groq_api_key)
                        digest = email_agent.generate_daily_digest()
                        context["report"] = digest
                        self.log_execution(agent_id, user_id, "Reporting", "success",
                            result=f"Report generated. Emails: {digest['total_emails_processed']}, Tasks: {digest['tasks_created']}, Leads: {digest['leads_detected']}, Spam: {digest['spam_flagged']}")
                    except Exception as ea:
                        self.log_execution(agent_id, user_id, "Reporting", "error", error=str(ea))

                elif action == "lead_score_and_save":
                    self.log_execution(agent_id, user_id, "Lead CRM", "in_progress", result="Scoring and saving lead to CRM...")
                    try:
                        from db import email_leads_collection
                        lead_doc = {
                            "user_id": ObjectId(user_id),
                            "name": params.get("name"),
                            "company": params.get("company"),
                            "contact_details": params.get("contact_details"),
                            "requirement": params.get("requirement") or clean_content[:300],
                            "score": params.get("score", 50),
                            "source": "agent_runner",
                            "status": "new",
                            "detected_at": datetime.now(timezone.utc)
                        }
                        ins = email_leads_collection.insert_one(lead_doc)
                        self.log_execution(agent_id, user_id, "Lead CRM", "success", result=f"Lead saved. Verifiable lead_id: {str(ins.inserted_id)}")
                    except Exception as ea:
                        self.log_execution(agent_id, user_id, "Lead CRM", "error", error=str(ea))

                self.log_execution(agent_id, user_id, f"Step: {step_desc}", "success", result=clean_content)

            agents_collection.update_one({"_id": ObjectId(agent_id)}, {"$set": {"status": "completed", "last_run": datetime.now(timezone.utc)}})
            
        except Exception as e:
            import traceback
            err_msg = f"Critical Runner Error: {str(e)}\n{traceback.format_exc()}"
            print(err_msg)
            self.log_execution(agent_id, user_id, "System Error", "error", error=str(e))
            agents_collection.update_one({"_id": ObjectId(agent_id)}, {"$set": {"status": "error"}})

    def perform_web_search(self, query: str, search_type: str = "jobs"):
        """Helper to perform real LinkedIn search (jobs or posts) via Direct Scraper."""
        scraper = DirectScraper()
        
        # Clean query
        clean_q = query.strip().replace("posts", "").replace("post", "").replace("recent", "").replace('"', '').strip()
        
        # Search type mapping
        s_type = "jobs"
        if search_type == "posts": s_type = "posts"
        elif search_type == "profile_search": s_type = "people"

        # Use DirectScraper instead of search_web
        results = scraper.discover_all(clean_q, search_type=s_type)

        # Transform into a format that the SLM/planner expects
        formatted = []
        for r in results:
            link = r.get("application_link") or r.get("link")
            if not link: continue
            
            low_link = link.lower()
            is_post = "/posts/" in low_link or "/activity/" in low_link or "/feed/update/" in low_link or "detail" in low_link
            is_profile = "/in/" in low_link
            
            formatted.append({
                "title": r.get("job_title") or r.get("title", "LinkedIn Result"),
                "company": r.get("company_name") or r.get("company", "LinkedIn"),
                "link": link,
                "snippet": r.get("job_description") or r.get("snippet", ""),
                "type": "post" if is_post else ("profile" if is_profile else search_type),
                "is_post": is_post
            })
            
        # Sort to put posts at the top, then profiles
        formatted.sort(key=lambda x: (x.get("is_post", False), "/in/" in x["link"]), reverse=True)
        return formatted

    def run_agent_background(self, agent_id: str):
        thread = threading.Thread(target=self.run_agent_sync, args=(agent_id,))
        thread.start()
        return thread
