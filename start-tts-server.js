const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const { promisify } = require('util');
const { join } = require('path');
const { unlink } = require('fs/promises');
const { v4: uuidv4 } = require('uuid');

const execAsync = promisify(exec);

const app = express();
app.use(cors());
app.use(express.json());

const TMP_DIR = join(process.cwd(), 'tmp');

app.post('/api/tts', async (req, res) => {
  const { text, voice, rate = 1 } = req.body;
  
  if (!text || !voice) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  const outputFile = join(TMP_DIR, `${uuidv4()}.mp3`);

  try {
    // 使用 edge-tts 生成音频
    const command = `edge-tts --voice ${voice} --rate=${rate} --text "${text}" --write-media ${outputFile}`;
    await execAsync(command);

    // 发送音频文件
    res.sendFile(outputFile);

    // 清理临时文件
    setTimeout(async () => {
      try {
        await unlink(outputFile);
      } catch (error) {
        console.error('Error cleaning up temp file:', error);
      }
    }, 1000);
  } catch (error) {
    console.error('TTS error:', error);
    res.status(500).json({ error: 'TTS generation failed' });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`TTS server running on port ${port}`);
});
