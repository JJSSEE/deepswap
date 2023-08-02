const express = require('express');
const multer = require('multer');
const { spawn } = require('child_process');
const path = require('path');

const app = express();
const port = 8888;

// Set up multer for file uploads
const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: function (req, file, cb) {
        const extension = file.mimetype.split('/')[1];
        cb(null, file.fieldname + Date.now() + '.' + extension);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit for files
    }
});

// Serve the index.html page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Handle file uploads and Python execution
app.post('/upload', upload.fields([{ name: 'image', maxCount: 1 }, { name: 'video', maxCount: 1 }]), (req, res) => {
    const imageFile = req.files['image'][0];
    const videoFile = req.files['video'][0];

    // Replace 'run.py' with the actual path to your Python script
    const pythonScript = 'run.py';

    const target = `${videoFile.path}`;
    const source = `${imageFile.path}`;
    const output = `${videoFile.path}_output.mp4`;
    const executionProvider = '--execution-provider';
    const cuda = 'cuda';
    const frameProcessor = '--frame-processor';
    const faceSwapper = 'face_swapper';
    const faceEnhancer = 'face_enhancer';

    // Spawn a child process to run the Python script
    const pythonProcess = spawn('python', [pythonScript, '--target', target, '--source', source, '--output', output, executionProvider, cuda, frameProcessor, faceSwapper, faceEnhancer]);

    pythonProcess.stdout.on('data', (data) => {
        console.log(`Python stdout: ${data}`);
    });

    pythonProcess.stderr.on('data', (data) => {
        console.error(`Python stderr: ${data}`);
    });

    pythonProcess.on('close', (code) => {
        console.log(`Python process exited with code ${code}`);
        if (code === 0) {
            // Send the rendered output video back to the client
            res.send(`<video controls><source src="${output}" type="video/mp4"></video>`);
        } else {
            res.status(500).send('An error occurred during Python execution.');
        }
    });
});

// Start the server on 0.0.0.0:8888
app.listen(port, '0.0.0.0', () => {
    console.log(`Server is running on http://0.0.0.0:${port}`);
});
