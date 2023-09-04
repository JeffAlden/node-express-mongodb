const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

const app = express();
const port = process.env.PORT || 3006;

const corsOptions = {
  origin: 'https://codebrew-rho.vercel.app', //  frontend application's URL
  optionsSuccessStatus: 204
};

const validCredentials = {
  admin: {
    username: 'admin',
    password: 'password123',
    isAdmin: true,
  },
  user: {
    username: 'user',
    password: 'password456',
    isAdmin: false,
  },
};

// MongoDB Connection
const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://codebrew:VHl6ZfONFtVmXJAU@cluster0.ptfzz1t.mongodb.net/codebrew';
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});


// Mongoose schema and model
const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
});

const User = mongoose.model('User', UserSchema);

app.use(bodyParser.json());
app.use(cors(corsOptions));


app.use((req, _, next) => {
  log(`Incoming HTTP Request - ${req.method} ${req.url}`);
  next();
});

app.use((err, req, res, next) => {
  log(`Error occurred during ${req.method} request for ${req.url}: ${err.stack}`);
  res.status(500).send('Something broke!');
});

app.post('/customer/signup', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name: name,
      email: email,
      password: hashedPassword,
    });

    try {
      const savedUser = await newUser.save();
      console.log(`[User Added] ${new Date().toISOString()} - Data:`, savedUser);
      res.json({ status: 'Success', data: savedUser });
    } catch (error) {
      console.error('Error adding new user:', error);
      res.status(500).json({ status: 'Failed', error: 'Error adding new user' });
    }
  } catch (error) {
    console.error('Error hashing password:', error);
    res.status(500).json({ status: 'Failed', error: 'Error hashing password' });
  }
});

app.post('/customer/login', async (req, res) => {
  const { email, password } = req.body;

  if (email === validCredentials.admin.email && password === validCredentials.admin.password) {
    console.log('[Admin Login] Successful');
    res.json({ status: 'Success', token: 'your-jwt-token', isAdmin: true });
    return;
  }

  try {
    const user = await User.findOne({ email: email });
    
    if (!user) {
      res.status(401).json({ status: 'Failed', error: 'User not found' });
    } else {
      const passwordMatch = await bcrypt.compare(password, user.password);

      if (!passwordMatch) {
        res.status(401).json({ status: 'Failed', error: 'Incorrect password' });
      } else {
        res.json({ status: 'Success', token: 'your-jwt-token', isAdmin: user.isAdmin });
      }
    }
  } catch (error) {
    console.error('Error checking user:', error);
    res.status(500).json({ status: 'Failed', error: 'Error checking user' });
  }
});


// Define the Staff schema
const staffSchema = new mongoose.Schema({
  name: String,
  email: String,
  phoneNumber: String,
  address: String,
});

// Create the Staff model
const Staff = mongoose.model('Staff', staffSchema);

app.use(bodyParser.json());

app.get('/staff', async (req, res) => {
  try {
    const staffMembers = await Staff.find({}, '_id name email phoneNumber address'); // Included _id 
    res.json(staffMembers);
  } catch (error) {
    console.error('Error fetching staff:', error);
    res.status(500).json({ error: 'Error fetching staff data' });
  }
});


app.post('/staff', async (req, res) => {
  const newStaff = req.body;
  try {
    const staffMember = new Staff(newStaff);
    await staffMember.save();
    console.log(`[Staff Added] ${new Date().toISOString()} - Data:`, staffMember);
    res.json({ status: 'Success', data: staffMember });
  } catch (error) {
    console.error('Error adding new staff:', error);
    res.status(500).json({ error: 'Error adding new staff' });
  }
});

app.put('/staff/:id', async (req, res) => {
  const { id } = req.params;
  const updatedStaff = req.body;
  try {
    const updatedStaffMember = await Staff.findByIdAndUpdate(id, updatedStaff, { new: true });
    console.log(`[Staff Updated] ${new Date().toISOString()} - Data:`, updatedStaffMember);
    res.json({ status: 'Updated', data: updatedStaffMember });
  } catch (error) {
    console.error(`[Database Error] ${new Date().toISOString()} - Error updating staff ID: ${id}:`, error);
    res.status(500).json({ error: 'Error updating staff' });
  }
});

app.delete('/staff/:id', async (req, res) => {
  const { id } = req.params;
  console.log('Received DELETE request for staff with id:', id);
  try {
    const staffDetails = await Staff.findByIdAndDelete(id);
    if (staffDetails) {
      console.log(`[Staff Deleted] ${new Date().toISOString()} - Data:`, staffDetails);
      res.json({ status: 'Deleted' });
    } else {
      res.status(404).json({ error: 'Staff not found' });
    }
  } catch (error) {
    console.error(`[Database Error] ${new Date().toISOString()} - Deleting staff ID: ${id}`, error);
    res.status(500).json({ error: 'Failed to delete staff' });
  }
});


function log(message) {
  console.log(message);
}

app.get('/', (_, res) => {
  log('Root endpoint accessed');
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <!-- Add Bootstrap 4 CDN -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <title>Document</title>
</head>

<style>
  body, html {
      margin: 0;
      padding: 0;
      background: black;
  }

  /* Added styles to stack canvas at bottom layer */
  #canvas {
      position: absolute;
      top: 0;
      left: 0;
      z-index: 0;
  }

  /* Added styles to stack text above canvas */
  .text-container {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    pointer-events: none; /* Add this line */
}

.content {
    font-family: 'Arial', sans-serif;
    font-size: 2rem;
    line-height: 1.5;
    color: #f0f1ef;
    text-align: center;
    pointer-events: auto;  /* Add this line */
}
  span {
    opacity: 0;
    animation: show_content 2s ease-in-out 1 forwards;
  }
  
  span:nth-child(2) { animation-delay: 1s; }
  span:nth-child(3) { animation-delay: 2s; }
  span:nth-child(4) { animation-delay: 3s; }

  @keyframes show_content {
    0% { opacity: 0; filter: blur(33px); }
    100% { opacity: 1; filter: blur(0px); }
  }

  .buymeacoffee {
    text-decoration: none;
    position: fixed;
    right: 2rem;
    bottom: 2rem;
    background: #595be9;
    width: 3.5rem;
    height: 3.5rem;
    border-radius: 50%;
    transition: all 0.1s linear;
    box-shadow: 0.2rem 0.2rem 0.5rem rgba(0, 0, 0, 0.2);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .buymeacoffee:hover {
    width: 4rem;
    height: 4rem;
    line-height: 4rem;
  }
</style>

<body>
  <!-- Text layer -->
  <div class="text-container">
      <div class="content">
          <span>Hello Wd74P,</span>
          <span>Server is</span>
          <span>running for</span>
          <span>Miniproject2!</span>
      </div>
  </div>

  <a href="https://codebrew-rho.vercel.app/" class="buymeacoffee" target="_blank" rel="noopener noreferrer">
  <svg width="25" height="35" viewBox="0 0 884 1279" fill="none">
    <path d="m791 298-1-1-2-1 3 2Zm13 91h-1 1Zm-13-92v1-1Zm0 1v-1 1Zm3 2-2-2h-1l3 2Zm-364 886-3 2h1l2-2Zm211-41v3-3Zm-22 41-3 2h1l2-2Zm-338 10-3-1 3 1Zm-33-32-1-4 1 4Z" fill="#0D0C22"></path>
    <path class="y-path" d="M473 591c-46 20-98 42-166 42-28 0-56-4-84-12l47 480a80 80 0 0 0 80 74l88 3 96-3a80 80 0 0 0 79-74l50-530c-22-8-44-13-70-13-44 0-79 15-120 33Z" fill="#FFF"></path>
    <path d="M79 386v1h1l-1-1Z" fill="#0D0C22"></path>
    <path d="m880 342-7-36c-7-31-21-62-54-73-10-4-22-5-30-13s-11-19-12-30l-11-61c-3-17-5-37-13-52-10-22-32-34-53-42-11-5-22-8-33-11C613 10 557 5 503 2c-66-4-132-2-198 3-48 5-100 10-146 27-17 6-35 14-47 27a51 51 0 0 0-10 61c8 14 22 24 37 31 19 8 39 15 60 19a1334 1334 0 0 0 417 7c19-3 31-27 25-44-6-21-24-28-44-25l-9 1h-2a1234 1234 0 0 1-313 1l-6-1h-1l-6-1a665 665 0 0 1-42-9 6 6 0 0 1 3-9 626 626 0 0 1 45-8l21-2a1336 1336 0 0 1 290 1l7 1h5l43 8c21 5 47 6 57 29 3 7 4 15 6 23l2 10a153589 153589 0 0 0 15 74 13 13 0 0 1-11 10l-3 1h-3a1670 1670 0 0 1-253 16 1976 1976 0 0 1-250-16l-7-1-15-3-52-8c-21-4-41-2-60 8-16 9-28 22-36 38-8 17-11 35-14 53-4 18-10 38-8 56 5 40 33 73 74 80a2072 2072 0 0 0 604 20 26 26 0 0 1 28 29l-3 37a15200479 15200479 0 0 1-55 528c-2 22-2 44-6 66-7 34-30 54-63 62-31 7-62 11-94 11l-105-1c-37 0-82-3-111-31-26-24-29-63-32-96l-14-131-25-242-17-157-1-8c-2-19-15-37-36-36-18 0-38 16-36 36l12 116 25 241 22 205 4 40c8 71 62 110 130 121 40 6 80 8 120 8 52 1 104 3 155-6 75-14 131-64 139-142a758975 758975 0 0 0 30-290l25-243 11-111a26 26 0 0 1 21-22c21-5 42-12 57-28 24-26 29-60 21-94ZM72 366v4-4Zm3 16 1 1-2-1h1Zm2 3c0 1 1 2 0 0Zm4 3Zm720-5c-8 7-20 11-31 12a2172 2172 0 0 1-667-2c-9-1-19-3-25-9-12-13-6-38-3-53 3-14 8-33 25-35 26-3 56 8 81 12a1787 1787 0 0 0 562-7c22-4 45-11 58 11 9 15 10 35 9 52-1 7-4 14-9 19Z" fill="#0D0C22"></path>
  </svg>
</a>

<canvas id="canvas"></canvas>

<script>
    window.requestAnimFrame = function () {
  return (
    window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    function (callback) {
      window.setTimeout(callback);
    }
  );
};

function init(elemid) {
  let canvas = document.getElementById(elemid),
    c = canvas.getContext("2d"),
    w = (canvas.width = window.innerWidth),
    h = (canvas.height = window.innerHeight);
  c.fillStyle = "rgba(30,30,30,1)";
  c.fillRect(0, 0, w, h);
  return { c: c, canvas: canvas };
}

window.onload = function () {
  let c = init("canvas").c,
    canvas = init("canvas").canvas,
    w = (canvas.width = window.innerWidth),
    h = (canvas.height = window.innerHeight),
    mouse = { x: false, y: false },
    last_mouse = {};

  function dist(p1x, p1y, p2x, p2y) {
    return Math.sqrt(Math.pow(p2x - p1x, 2) + Math.pow(p2y - p1y, 2));
  }

  class segment {
    constructor(parent, l, a, first) {
      this.first = first;
      if (first) {
        this.pos = {
          x: parent.x,
          y: parent.y
        };
      } else {
        this.pos = {
          x: parent.nextPos.x,
          y: parent.nextPos.y
        };
      }
      this.l = l;
      this.ang = a;
      this.nextPos = {
        x: this.pos.x + this.l * Math.cos(this.ang),
        y: this.pos.y + this.l * Math.sin(this.ang)
      };
    }
    update(t) {
      this.ang = Math.atan2(t.y - this.pos.y, t.x - this.pos.x);
      this.pos.x = t.x + this.l * Math.cos(this.ang - Math.PI);
      this.pos.y = t.y + this.l * Math.sin(this.ang - Math.PI);
      this.nextPos.x = this.pos.x + this.l * Math.cos(this.ang);
      this.nextPos.y = this.pos.y + this.l * Math.sin(this.ang);
    }
    fallback(t) {
      this.pos.x = t.x;
      this.pos.y = t.y;
      this.nextPos.x = this.pos.x + this.l * Math.cos(this.ang);
      this.nextPos.y = this.pos.y + this.l * Math.sin(this.ang);
    }
    show() {
      c.lineTo(this.nextPos.x, this.nextPos.y);
    }
  }

  class tentacle {
    constructor(x, y, l, n, a) {
      this.x = x;
      this.y = y;
      this.l = l;
      this.n = n;
      this.t = {};
      this.rand = Math.random();
      this.segments = [new segment(this, this.l / this.n, 0, true)];
      for (let i = 1; i < this.n; i++) {
        this.segments.push(
          new segment(this.segments[i - 1], this.l / this.n, 0, false)
        );
      }
    }
    move(last_target, target) {
      this.angle = Math.atan2(target.y - this.y, target.x - this.x);
      this.dt = dist(last_target.x, last_target.y, target.x, target.y) + 5;
      this.t = {
        x: target.x - 0.8 * this.dt * Math.cos(this.angle),
        y: target.y - 0.8 * this.dt * Math.sin(this.angle)
      };
      if (this.t.x) {
        this.segments[this.n - 1].update(this.t);
      } else {
        this.segments[this.n - 1].update(target);
      }
      for (let i = this.n - 2; i >= 0; i--) {
        this.segments[i].update(this.segments[i + 1].pos);
      }
      if (
        dist(this.x, this.y, target.x, target.y) <=
        this.l + dist(last_target.x, last_target.y, target.x, target.y)
      ) {
        this.segments[0].fallback({ x: this.x, y: this.y });
        for (let i = 1; i < this.n; i++) {
          this.segments[i].fallback(this.segments[i - 1].nextPos);
        }
      }
    }
    show(target) {
      if (dist(this.x, this.y, target.x, target.y) <= this.l) {
        c.globalCompositeOperation = "lighter";
        c.beginPath();
        c.lineTo(this.x, this.y);
        for (let i = 0; i < this.n; i++) {
          this.segments[i].show();
        }
        c.strokeStyle =
          "hsl(" +
          (this.rand * 60 + 180) +
          ",100%," +
          (this.rand * 60 + 25) +
          "%)";
        c.lineWidth = this.rand * 2;
        c.lineCap = "round";
        c.lineJoin = "round";
        c.stroke();
        c.globalCompositeOperation = "source-over";
      }
    }
    show2(target) {
      c.beginPath();
      if (dist(this.x, this.y, target.x, target.y) <= this.l) {
        c.arc(this.x, this.y, 2 * this.rand + 1, 0, 2 * Math.PI);
        c.fillStyle = "white";
      } else {
        c.arc(this.x, this.y, this.rand * 2, 0, 2 * Math.PI);
        c.fillStyle = "darkcyan";
      }
      c.fill();
    }
  }

  let maxl = 300,
    minl = 50,
    n = 30,
    numt = 500,
    tent = [],
    clicked = false,
    target = { x: 0, y: 0 },
    last_target = {},
    t = 0,
    q = 10;

  for (let i = 0; i < numt; i++) {
    tent.push(
      new tentacle(
        Math.random() * w,
        Math.random() * h,
        Math.random() * (maxl - minl) + minl,
        n,
        Math.random() * 2 * Math.PI
      )
    );
  }
  function draw() {
    if (mouse.x) {
      target.errx = mouse.x - target.x;
      target.erry = mouse.y - target.y;
    } else {
      target.errx =
        w / 2 +
        ((h / 2 - q) * Math.sqrt(2) * Math.cos(t)) /
          (Math.pow(Math.sin(t), 2) + 1) -
        target.x;
      target.erry =
        h / 2 +
        ((h / 2 - q) * Math.sqrt(2) * Math.cos(t) * Math.sin(t)) /
          (Math.pow(Math.sin(t), 2) + 1) -
        target.y;
    }

    target.x += target.errx / 10;
    target.y += target.erry / 10;

    t += 0.01;

    c.beginPath();
    c.arc(
      target.x,
      target.y,
      dist(last_target.x, last_target.y, target.x, target.y) + 5,
      0,
      2 * Math.PI
    );
    c.fillStyle = "hsl(210,100%,80%)";
    c.fill();

    for (i = 0; i < numt; i++) {
      tent[i].move(last_target, target);
      tent[i].show2(target);
    }
    for (i = 0; i < numt; i++) {
      tent[i].show(target);
    }
    last_target.x = target.x;
    last_target.y = target.y;
  }

  canvas.addEventListener(
    "mousemove",
    function (e) {
      last_mouse.x = mouse.x;
      last_mouse.y = mouse.y;

      mouse.x = e.pageX - this.offsetLeft;
      mouse.y = e.pageY - this.offsetTop;
    },
    false
  );

  canvas.addEventListener("mouseleave", function (e) {
    mouse.x = false;
    mouse.y = false;
  });

  canvas.addEventListener(
    "mousedown",
    function (e) {
      clicked = true;
    },
    false
  );

  canvas.addEventListener(
    "mouseup",
    function (e) {
      clicked = false;
    },
    false
  );

  function loop() {
    window.requestAnimFrame(loop);
    c.clearRect(0, 0, w, h);
    draw();
  }

  window.addEventListener("resize", function () {
    (w = canvas.width = window.innerWidth),
      (h = canvas.height = window.innerHeight);
    loop();
  });

  loop();
  setInterval(loop, 1000 / 60);
};
</script>

</body>

</html>
    `);
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
