# Game.py Example

## Sample game.py content that would be displayed in the terminal:

```python
import pygame
import sys

# Initialize Pygame
pygame.init()

# Set up the display
width, height = 800, 600
screen = pygame.display.set_mode((width, height))
pygame.display.set_caption("Simple Game")

# Colors
WHITE = (255, 255, 255)
BLUE = (0, 0, 255)

# Game loop
running = True
while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
    
    # Clear screen
    screen.fill(WHITE)
    
    # Draw a simple blue rectangle
    pygame.draw.rect(screen, BLUE, (100, 100, 200, 150))
    
    # Update display
    pygame.display.flip()

# Quit
pygame.quit()
sys.exit()
```

## Now when you run `python game.py` in the terminal:

```bash
admin$ python game.py
Running game.py...
import pygame
import sys

# Initialize Pygame
pygame.init()

# Set up the display
width, height = 800, 600
screen = pygame.display.set_mode((width, height))
pygame.display.set_caption("Simple Game")

# Colors
WHITE = (255, 255, 255)
BLUE = (0, 0, 255)

# Game loop
running = True
while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
    
    # Clear screen
    screen.fill(WHITE)
    
    # Draw a simple blue rectangle
    pygame.draw.rect(screen, BLUE, (100, 100, 200, 150))
    
    # Update display
    pygame.display.flip()

# Quit
pygame.quit()
sys.exit()
Script executed successfully.
Python version: 3.11.5
```

## This fix applies to all programming languages:

- **Python (.py)** - Shows actual Python code
- **JavaScript (.js)** - Shows actual JavaScript code  
- **Java (.java)** - Shows actual Java code
- **Go (.go)** - Shows actual Go code
- **Ruby (.rb)** - Shows actual Ruby code
- **PHP (.php)** - Shows actual PHP code
- **R (.R)** - Shows actual R code
- **TypeScript (.ts)** - Shows actual TypeScript code

The terminal now reads the actual file content from the workspace and displays it when running scripts!
