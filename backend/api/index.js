module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "GET") {
    res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
    return;
  }

  res.status(200).json({
    success: true,
    service: "synergy-backend",
    status: "running ok",
    message: "Synergy backend API deployed on Vercel",
    time: new Date().toISOString(),
    endpoint: "/api/health",
  });
};
