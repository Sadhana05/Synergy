from collections import deque

def shortestPathLength(graph):
    n = len(graph)
    queue = deque([(i, 1 << i, 0) for i in range(n)])
    visited = {(i, 1 << i) for i in range(n)}
    all_nodes = (1 << n) - 1

    while queue:
        node, state, length = queue.popleft()
        if state == all_nodes:
            return length
        for neighbor in graph[node]:
            new_state = state | (1 << neighbor)
            if (neighbor, new_state) not in visited:
                queue.append((neighbor, new_state, length + 1))
                visited.add((neighbor, new_state))
    return -1