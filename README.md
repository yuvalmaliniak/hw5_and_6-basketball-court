# Computer Graphics - Exercise 5 + 6 - WebGL Basketball Court

## Getting Started
1. Clone this repository to your local machine
2. Make sure you have Node.js installed
3. Start the local web server: `node index.js`
4. Open your browser and go to http://localhost:8000

## Complete Instructions
**All detailed instructions, requirements, and specifications can be found in:**
`basketball_exercise_instructions.html`

## Group Members
**MANDATORY: Add the full names of all group members here:**
- Yuval Maliniak
- Omer Yanay

## Additional Features Implemented (EX5)
- More detailed court markings (key areas, three-point lines, center circle, free throw arcs)
- Enhanced stadium environment
- Multiple camera preset positions (Top-down, Side, Backboard)
- Extra lighting for better shadow and realism
- Scoreboard

## Additional Features Implemented (EX6)
- Multiple Hoops — automatic targeting at both hoops depending on the ball position.
- Combo System — Implemented (tracking consecutive shots and awarding bonus points or showing messages).
- Sound Effects — Added (playing sounds on scoring, rim hits, and bounces).

## Controls:
- Arrow keys: Move ball left/right/forward/back
- W/S: Increase/decrease shot power
- Space: Shoot ball
- R: Reset ball
- O: Toggle orbit controls
- 1/2/3: Change camera view (top-down, side, backboard)

## Physics System Description
- The basketball follows projectile motion influenced by gravity (acceleration vector).
- Collisions with the ground and rim use restitution coefficients to simulate bounce.
- Spin is applied based on shot velocity for realistic ball rotation.
- Scoring is detected by checking if the ball passes inside the rim area while descending.

## Known Issues or Limitations
- The scoreboard / scoring is not seen perfectly from all angles
- Basket not 100% realistic when looking behind it
- Rim detection not 100% well realistic. 

## External Assets Used
- [three.js](https://threejs.org/) library
- OrbitControls from Three.js examples
- Sounds : https://pixabay.com/sound-effects/search/basketball-rim

## Technical Details & How to run
- Run the server with: `node index.js`
- Access at http://localhost:8000 in your web browser
