# Custom Port & Localhost Edge Integration

## 🚀 Port Customization Added

### ✅ Custom Port Support
Now you can specify any port number for your web servers!

```bash
serve <directory> [port]         # Default: 3000
live-server <directory> [port]   # Default: 8080
```

## 🎯 Usage Examples

### ✅ Custom Port 5555
```bash
admin$ serve public 5555
Starting local server for public...
Server running at http://localhost:5555
Serving files from public/
Opening in Microsoft Edge...
Press Ctrl+C to stop

admin$ live-server src 5555
Starting live reload server for src...
Server running at http://localhost:5555
Live reload enabled for src/
Opening in Microsoft Edge...
Watching for file changes...
```

### ✅ Different Ports
```bash
admin$ serve . 8080
Starting local server for . ...
Server running at http://localhost:8080
Serving files from ./ 
Opening in Microsoft Edge...
Press Ctrl+C to stop

admin$ live-server dist 9000
Starting live reload server for dist...
Server running at http://localhost:9000
Live reload enabled for dist/
Opening in Microsoft Edge...
Watching for file changes...

admin$ serve build 3001
Starting local server for build...
Server running at http://localhost:3001
Serving files from build/
Opening in Microsoft Edge...
Press Ctrl+C to stop
```

## 🌐 Localhost Edge Integration

### ✅ Enhanced Edge Command
Localhost URLs automatically open in Microsoft Edge!

```bash
edge localhost:5555
edge localhost:8080
edge localhost:3000
edge http://localhost:9000
```

### ✅ Localhost Examples
```bash
admin$ edge localhost:5555
Opening http://localhost:5555 in Microsoft Edge...
Microsoft Edge launched successfully
URL: http://localhost:5555

admin$ edge localhost:8080
Opening http://localhost:8080 in Microsoft Edge...
Microsoft Edge launched successfully
URL: http://localhost:8080

admin$ edge http://localhost:3000
Opening http://localhost:3000 in Microsoft Edge...
Microsoft Edge launched successfully
URL: http://localhost:3000
```

## 🔍 Smart Port Detection

### ✅ Node.js Port Detection
The terminal automatically detects custom ports in Node.js files!

```javascript
// server.js - Custom port 5555
const express = require('express');
const app = express();
const port = 5555;

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
```

```bash
admin$ node server.js
Running server.js...
const express = require('express');
const app = express();
const port = 5555;

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
Server running on port 5555
Opening in Microsoft Edge...
Node.js version: v18.17.0
```

### ✅ Multiple Port Patterns
```javascript
// Pattern 1: listen(5555)
app.listen(5555, () => console.log('Server ready'));

// Pattern 2: port: 8080
const server = app.listen({ port: 8080 });

// Pattern 3: PORT = 3000
const PORT = 3000;
app.listen(PORT);
```

## 📱 Complete Workflow Examples

### ✅ Example 1: Custom Port 5555
```bash
# 1. Create HTML file
admin$ touch index.html

# 2. Start server on port 5555
admin$ serve . 5555
Starting local server for . ...
Server running at http://localhost:5555
Serving files from ./ 
Opening in Microsoft Edge...
Press Ctrl+C to stop

# 3. Direct localhost access
admin$ edge localhost:5555
Opening http://localhost:5555 in Microsoft Edge...
Microsoft Edge launched successfully
URL: http://localhost:5555
```

### ✅ Example 2: Live Server on Custom Port
```bash
# 1. Start live server on port 8080
admin$ live-server src 8080
Starting live reload server for src...
Server running at http://localhost:8080
Live reload enabled for src/
Opening in Microsoft Edge...
Watching for file changes...

# 2. Access directly
admin$ edge localhost:8080
Opening http://localhost:8080 in Microsoft Edge...
Microsoft Edge launched successfully
URL: http://localhost:8080
```

### ✅ Example 3: Node.js Custom Port
```javascript
// app.js - Custom port 9000
const express = require('express');
const app = express();
const PORT = 9000;

app.get('/', (req, res) => {
  res.send('Hello from port 9000!');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

```bash
admin$ node app.js
Running app.js...
const express = require('express');
const app = express();
const PORT = 9000;

app.get('/', (req, res) => {
  res.send('Hello from port 9000!');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
Server running on port 9000
Opening in Microsoft Edge...
Node.js version: v18.17.0
```

## 🎨 Enhanced Features

### ✅ Port Flexibility
- **Any port number** - Use any valid port (1024-65535)
- **Default ports** - 3000 for serve, 8080 for live-server
- **Auto-detection** - Node.js files automatically detect custom ports
- **Consistent behavior** - All servers open in Edge automatically

### ✅ Localhost Handling
- **localhost:port** - Automatically adds http:// prefix
- **Full URLs** - Handles http://localhost:port
- **Edge integration** - All localhost URLs open in Edge
- **URL display** - Shows the complete URL being opened

### ✅ Smart Detection
```typescript
// Port detection patterns
const portMatch = file.content.match(/listen\((\d+)\)/) ||     // app.listen(5555)
                   file.content.match(/port\s*:\s*(\d+)/) ||      // port: 8080
                   file.content.match(/PORT\s*=\s*(\d+)/);        // PORT = 3000
```

## 📋 Command Reference

| Command | Port Support | Edge Auto-Open | Examples |
|---------|--------------|----------------|----------|
| `serve <dir> [port]` | ✅ Custom | ✅ Yes | `serve . 5555` |
| `live-server <dir> [port]` | ✅ Custom | ✅ Yes | `live-server src 8080` |
| `node server.js` | ✅ Auto-detect | ✅ Yes | Detects port from code |
| `edge localhost:port` | ✅ Any | ✅ Yes | `edge localhost:5555` |
| `edge http://localhost:port` | ✅ Any | ✅ Yes | `edge http://localhost:8080` |

## 🚀 Getting Started

### ✅ Quick Start with Port 5555
```bash
# 1. Start server on port 5555
admin$ serve . 5555

# 2. Edge opens automatically to http://localhost:5555

# 3. Or open manually
admin$ edge localhost:5555
```

### ✅ Live Development on Custom Port
```bash
# 1. Start live server on port 8080
admin$ live-server . 8080

# 2. Edge opens automatically to http://localhost:8080

# 3. Changes reload automatically in Edge
```

### ✅ Node.js with Custom Port
```bash
# 1. Create server with custom port
# 2. Run node server.js
# 3. Terminal detects port and opens Edge automatically
```

## 🎯 Perfect For

- **Custom port development** - Use any port you need
- **Multiple projects** - Different ports for different projects
- **Team collaboration** - Avoid port conflicts
- **Localhost testing** - Direct localhost URL access
- **Edge browser testing** - All web outputs in Microsoft Edge

**Now you can use any port number (like 5555) and all localhost links open in Microsoft Edge!** 🎉

**Perfect for custom development workflows and Edge browser testing!** 🚀
