import { useState, useEffect } from 'react';
import { Box, Typography, LinearProgress, Alert } from '@mui/material';

const CallQualityMonitor = ({ peerConnection }) => {
  const [stats, setStats] = useState({
    bitrate: 0,
    packetLoss: 0,
    latency: 0,
    resolution: '',
    qualityScore: 100
  });

  const [warning, setWarning] = useState(null);

  useEffect(() => {
    if (!peerConnection) return;

    const interval = setInterval(async () => {
      try {
        const stats = await peerConnection.getStats();
        let videoStats = {};
        let audioStats = {};
        
        stats.forEach(stat => {
          if (stat.type === 'inbound-rtp' && stat.kind === 'video') {
            videoStats = stat;
          }
          if (stat.type === 'inbound-rtp' && stat.kind === 'audio') {
            audioStats = stat;
          }
        });

        const qualityScore = calculateQualityScore(videoStats, audioStats);
        
        setStats(prevStats => ({
          ...prevStats,
          bitrate: calculateBitrate(videoStats),
          packetLoss: calculatePacketLoss(videoStats, audioStats),
          latency: calculateLatency(stats),
          resolution: `${videoStats.frameWidth}x${videoStats.frameHeight}`,
          qualityScore
        }));

        // Set warnings based on quality
        if (qualityScore < 50) {
          setWarning('Poor connection quality. Check your internet connection.');
        } else if (qualityScore < 70) {
          setWarning('Connection quality is degraded.');
        } else {
          setWarning(null);
        }

      } catch (error) {
        console.error('Error getting call stats:', error);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [peerConnection]);

  const calculateQualityScore = (videoStats, audioStats) => {
    // Implement quality scoring based on various metrics
    let score = 100;
    
    // Deduct points for packet loss
    if (videoStats.packetsLost > 0) {
      score -= (videoStats.packetsLost / videoStats.packetsReceived) * 100;
    }
    
    // Deduct points for frame drops
    if (videoStats.framesDropped > 0) {
      score -= (videoStats.framesDropped / videoStats.framesReceived) * 50;
    }
    
    // Deduct points for high latency
    if (stats.latency > 150) {
      score -= (stats.latency - 150) / 10;
    }

    return Math.max(0, Math.min(100, score));
  };

  return (
    <Box sx={{ p: 2 }}>
      {warning && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {warning}
        </Alert>
      )}

      <Typography variant="subtitle2">
        Call Quality: {Math.round(stats.qualityScore)}%
      </Typography>
      <LinearProgress 
        variant="determinate" 
        value={stats.qualityScore}
        color={stats.qualityScore > 70 ? 'success' : stats.qualityScore > 50 ? 'warning' : 'error'}
        sx={{ mb: 2 }}
      />

      <Typography variant="body2">
        Resolution: {stats.resolution}
      </Typography>
      <Typography variant="body2">
        Bitrate: {(stats.bitrate / 1024 / 1024).toFixed(2)} Mbps
      </Typography>
      <Typography variant="body2">
        Packet Loss: {stats.packetLoss.toFixed(2)}%
      </Typography>
      <Typography variant="body2">
        Latency: {stats.latency}ms
      </Typography>
    </Box>
  );
};

export default CallQualityMonitor; 