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

const log = (message) => {
  console.log(`[${new Date().toISOString()}] ${message}`);
};

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
    <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>

<Style>
    .content{
    position: absolute;
    top:50%;
    left:50%;
    transform: translate(-50%, -50%);
    font-size: 30px;
    font-family: monospace;
    letter-spacing: 20px;
    width:max-content;
}
span{
    opacity: 0;
    animation:show_content 2s ease-in-out 1 forwards;
}
span:nth-child(2){
    animation-delay: 1s;
}
span:nth-child(3){
    animation-delay: 2s;
}
span:nth-child(4){
    animation-delay: 3s;
}
@keyframes show_content{
    0%{
        opacity: 0;
        filter:blur(33px)
    }100%{
        opacity: 1;
        filter:blur(0px)
    }
}
#svg{
    position: relative;
    z-index: -1;
}
.ellipse:nth-child(2n){
    filter:blur(5px)
}
.line{
    opacity: 0.5;
}
</Style>

</head>
<body>
    <div class="content">
        <span>Hello Wd74P,</span>
        <span>Server is</span>
        <span>running for</span>
        <span> Miniproject2!</span>
    </div>
    <svg width="100vw" height="100vh" id="svg"></svg>
    
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.6.0/jquery.min.js"></script>
    <script>
       $(document).ready(function(){
    var array = [];
    var heightWindow = $(window).height();
    var widthWindow = $(window).width();

    for(var i = 0; i < 40; i++){
        array.push({
            top: Math.floor(Math.random()*heightWindow),
            left: Math.floor(Math.random()*widthWindow),
            id: i
        })
    }
    array.forEach(function(value){
        var newEllipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        newEllipse.setAttribute('class','ellipse');
        newEllipse.setAttribute('id','ellipse_'+value.id);
        newEllipse.setAttribute('cx',value.left);
        newEllipse.setAttribute('cy',value.top);
        newEllipse.setAttribute('rx',5);
        newEllipse.setAttribute('ry',5);

        $('#svg').append(newEllipse);
    })

    $(window).mousemove(function(event){
        $('line').remove();
        (array.filter(val => Math.abs(val.top - event.pageY) <= 350 && Math.abs(val.left - event.pageX) <= 350)).forEach(function(value){
            var newLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            newLine.setAttribute('class','line');
            newLine.setAttribute('id','line_'+value.id);
            newLine.setAttribute('x1',value.left);
            newLine.setAttribute('y1',value.top);
            newLine.setAttribute('x2',event.pageX);
            newLine.setAttribute('y2',event.pageY);
            newLine.setAttribute('stroke','black');
            $('#svg').append(newLine);
        })
    })
    $(window).mouseout(function(event){
        $('line').remove();
    });
    setInterval(function(){
        // Math.random()*(max - min ) + min
        array.forEach(function(value, key){
            var top = Math.random()*((value.top + 2) - (value.top - 2) ) + (value.top - 2);
            var left = Math.random()*((value.left + 2) - (value.left - 2) ) + (value.left - 2);
            array[key].top = top;
            array[key].left = left;

            var $ellipse = $('#ellipse_' + value.id);
            $ellipse.animate({dot: 0},{
                step: () => {$ellipse.attr('cx', left), $ellipse.attr('cy', top)},
                duration: 1
            });

            if($('#line_' + value.id).lengh){
                var $line = $('#line_' + value.id);
                $line.animate({dot: 0},{
                step: () => {$line.attr('x1', left), $line.attr('y1', top)},
                duration: 1
            });
            }
        })
    },500)
    console.log(array);
}) 
    </script>
</body>
</html>
    `);
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
