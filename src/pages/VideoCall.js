import React from 'react';
import { useParams } from 'react-router-dom';
import VideoCallComponent from '../components/video/VideoCall';

const VideoCall = () => {
  const { id } = useParams();
  return <VideoCallComponent roomId={id} />;
};

export default VideoCall; 