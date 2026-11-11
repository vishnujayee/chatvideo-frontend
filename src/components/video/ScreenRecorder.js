import { useState, useRef } from 'react';
import { Button, CircularProgress, Stack, Alert } from '@mui/material';
import { uploadMedia } from '../../services/api';

const ScreenRecorder = ({ roomId }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [error, setError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const mediaRecorder = useRef(null);
  const recordedChunks = useRef([]);

  const startRecording = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { mediaSource: 'screen' }
      });
      mediaRecorder.current = new MediaRecorder(stream);
      recordedChunks.current = [];
      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.current.push(event.data);
        }
      };
      mediaRecorder.current.onstop = () => {
        const blob = new Blob(recordedChunks.current, { type: 'video/webm' });
        setRecordedBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorder.current.onerror = (e) => {
        setError('Recording error: ' + e.error?.message || e.message);
      };
      mediaRecorder.current.start();
      setIsRecording(true);
      setIsPaused(false);
      setRecordedBlob(null);
    } catch (error) {
      setError('Error starting screen recording: ' + (error.message || error));
    }
  };

  const pauseRecording = () => {
    if (mediaRecorder.current && isRecording && !isPaused) {
      mediaRecorder.current.pause();
      setIsPaused(true);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorder.current && isRecording && isPaused) {
      mediaRecorder.current.resume();
      setIsPaused(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      setIsRecording(false);
      setIsPaused(false);
    }
  };

  const uploadRecording = async () => {
    if (!recordedBlob) return;
    try {
      setIsUploading(true);
      setError(null);
      setUploadSuccess(false);
      const formData = new FormData();
      formData.append('file', recordedBlob, `screen-recording-${Date.now()}.webm`);
      formData.append('roomId', roomId);
      await uploadMedia(formData);
      setUploadSuccess(true);
      // Optionally, call a parent callback here
    } catch (error) {
      setError('Error uploading recording: ' + (error.message || error));
    } finally {
      setIsUploading(false);
    }
  };

  const downloadRecording = () => {
    if (!recordedBlob) return;
    const url = URL.createObjectURL(recordedBlob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `screen-recording-${Date.now()}.webm`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  };

  return (
    <Stack spacing={2} direction="column" alignItems="center">
      {error && <Alert severity="error">{error}</Alert>}
      {uploadSuccess && <Alert severity="success">Upload successful!</Alert>}
      {!isRecording && !recordedBlob && (
        <Button
          variant="contained"
          color="primary"
          onClick={startRecording}
          disabled={isUploading}
        >
          Start Recording
        </Button>
      )}
      {isRecording && (
        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            color="secondary"
            onClick={stopRecording}
            disabled={isUploading}
          >
            Stop
          </Button>
          {!isPaused ? (
            <Button
              variant="outlined"
              onClick={pauseRecording}
              disabled={isUploading}
            >
              Pause
            </Button>
          ) : (
            <Button
              variant="outlined"
              onClick={resumeRecording}
              disabled={isUploading}
            >
              Resume
            </Button>
          )}
        </Stack>
      )}
      {recordedBlob && (
        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            color="primary"
            onClick={uploadRecording}
            disabled={isUploading}
          >
            Upload
          </Button>
          <Button
            variant="outlined"
            onClick={downloadRecording}
            disabled={isUploading}
          >
            Download
          </Button>
          <Button
            variant="text"
            color="error"
            onClick={() => setRecordedBlob(null)}
            disabled={isUploading}
          >
            Discard
          </Button>
        </Stack>
      )}
      {isUploading && <CircularProgress size={24} />}
    </Stack>
  );
};

export default ScreenRecorder; 