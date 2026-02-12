import { useState, useCallback, useRef, useEffect } from "react";
import React from "react";

// Music Player Component
function MusicPlayer() {
  const [isMuted, setIsMuted] = useState(true);
  const audioRef = useRef<HTMLAudioElement>(null);
  const hasStartedRef = useRef(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const playlistRef = useRef<string[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.3); // 添加音量状态
  const [showVolumeSlider, setShowVolumeSlider] = useState(false); // 音量滑块显示状态
  const volumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null); // 音量延迟关闭定时器
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 自动扫描 music 文件夹中的所有音频文件
  useEffect(() => {
    const loadMusicFiles = async () => {
      // 使用 Vite 的 glob 导入功能自动获取所有音频文件
      const musicModules = import.meta.glob('/music/*.{mp3,wav,ogg,m4a,flac}', { 
        query: '?url', 
        import: 'default',
        eager: true
      });
      const musicFiles = Object.values(musicModules) as string[];
      
      if (musicFiles.length === 0) {
        console.warn('music 文件夹中没有找到音频文件');
        return;
      }

      // Fisher-Yates 洗牌算法生成随机播放列表
      const shuffleArray = (array: string[]) => {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
      };

      playlistRef.current = shuffleArray(musicFiles);
      console.log('随机播放列表:', playlistRef.current);
      
      // 设置初始音频源
      if (audioRef.current && playlistRef.current.length > 0) {
        audioRef.current.src = playlistRef.current[0];
      }
    };
    
    loadMusicFiles();
  }, []);

  // 更新播放时间
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, []);

  // 播放下一首
  const playNextTrack = useCallback(() => {
    if (playlistRef.current.length === 0) return;
    
    const nextIndex = (currentTrackIndex + 1) % playlistRef.current.length;
    setCurrentTrackIndex(nextIndex);
    
    if (audioRef.current) {
      const audio = audioRef.current;
      audio.src = playlistRef.current[nextIndex];
      
      // 直接播放，不等待完全加载
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          // 如果直接播放失败，等待一下再试
          console.log('播放下一首失败，尝试重新播放:', err);
          setTimeout(() => {
            audio.play().catch(e => console.log('重试播放失败:', e));
          }, 100);
        });
      }
    }
  }, [currentTrackIndex]);

  // 播放上一首
  const playPrevTrack = useCallback(() => {
    if (playlistRef.current.length === 0) return;
    
    const prevIndex = (currentTrackIndex - 1 + playlistRef.current.length) % playlistRef.current.length;
    setCurrentTrackIndex(prevIndex);
    
    if (audioRef.current) {
      const audio = audioRef.current;
      audio.src = playlistRef.current[prevIndex];
      
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.log('播放上一首失败，尝试重新播放:', err);
          setTimeout(() => {
            audio.play().catch(e => console.log('重试播放失败:', e));
          }, 100);
        });
      }
    }
  }, [currentTrackIndex]);

  // 切换播放/暂停
  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
    }
  };

  // 跳转到指定时间
  const seekTo = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  // 调整音量
  const changeVolume = (newVolume: number) => {
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  // 切换到指定曲目
  const playTrack = (index: number) => {
    if (audioRef.current && playlistRef.current[index]) {
      setCurrentTrackIndex(index);
      const audio = audioRef.current;
      audio.src = playlistRef.current[index];
      
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.log('播放失败，尝试重新播放:', err);
          setTimeout(() => {
            audio.play().catch(e => console.log('重试播放失败:', e));
          }, 100);
        });
      }
    }
  };

  // 格式化时间
  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // 获取文件名（从完整路径中提取）
  const getFileName = (path: string) => {
    if (!path) return 'Unknown';
    // 处理 blob URL 或普通路径
    const parts = path.split('/');
    const filename = parts[parts.length - 1];
    // 移除文件扩展名和可能的查询参数
    return decodeURIComponent(filename.split('?')[0].replace(/\.[^/.]+$/, ''));
  };

  // 处理鼠标悬浮
  const handleMouseEnter = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
    }
    hoverTimerRef.current = setTimeout(() => {
      setShowPanel(true);
    }, 300); // 改成0.3秒
  };

  const handleMouseLeave = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
    }
  };

  const handlePanelMouseEnter = () => {
    // 鼠标进入面板时，取消关闭
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
    }
  };

  const handlePanelMouseLeave = () => {
    // 延迟关闭面板 400ms
    hoverTimerRef.current = setTimeout(() => {
      setShowPanel(false);
    }, 400);
  };

  // 监听音频结束事件，自动播放下一首
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.addEventListener('ended', playNextTrack);
      return () => {
        audio.removeEventListener('ended', playNextTrack);
      };
    }
  }, [playNextTrack]);

  useEffect(() => {
    // 监听用户的首次点击或触摸交互
    const handleFirstInteraction = () => {
      if (audioRef.current && !hasStartedRef.current && playlistRef.current.length > 0) {
        hasStartedRef.current = true; // 立即设置为 true，防止重复触发
        
        // 立即移除所有事件监听器
        document.removeEventListener('click', handleFirstInteraction, true);
        document.removeEventListener('touchstart', handleFirstInteraction, true);
        document.removeEventListener('keydown', handleFirstInteraction, true);
        
        const audio = audioRef.current;
        
        // 确保音频源已设置
        if (!audio.src && playlistRef.current.length > 0) {
          audio.src = playlistRef.current[0];
        }
        
        // 开始播放
        audio.volume = 0.3; // 设置音量为 30%
        audio.muted = true;
        
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              // 静音播放0.1秒后自动取消静音
              setTimeout(() => {
                if (audioRef.current) {
                  audioRef.current.muted = false;
                  setIsMuted(false);
                }
              }, 100);
            })
            .catch((err) => {
              console.log("播放失败:", err);
              // 如果播放失败，尝试重新加载并播放
              audio.load();
              setTimeout(() => {
                audio.play()
                  .then(() => {
                    setTimeout(() => {
                      if (audioRef.current) {
                        audioRef.current.muted = false;
                        setIsMuted(false);
                      }
                    }, 100);
                  })
                  .catch(() => {
                    hasStartedRef.current = false; // 如果失败，允许重试
                  });
              }, 200);
            });
        }
      }
    };

    // 只监听点击、触摸和按键事件（这些是浏览器认可的用户交互）
    document.addEventListener('click', handleFirstInteraction, { capture: true });
    document.addEventListener('touchstart', handleFirstInteraction, { capture: true });
    document.addEventListener('keydown', handleFirstInteraction, { capture: true });

    return () => {
      // 清理所有事件监听器
      document.removeEventListener('click', handleFirstInteraction, true);
      document.removeEventListener('touchstart', handleFirstInteraction, true);
      document.removeEventListener('keydown', handleFirstInteraction, true);
    };
  }, []);

  const toggleMute = () => {
    if (audioRef.current && playlistRef.current.length > 0) {
      // 如果还没开始播放，先尝试播放
      if (!hasStartedRef.current) {
        audioRef.current.muted = false;
        audioRef.current.play().then(() => {
          hasStartedRef.current = true;
          setIsMuted(false);
        }).catch(() => {
          console.log("播放失败");
        });
      } else {
        // 已经在播放，只切换静音状态
        const newMutedState = !isMuted;
        audioRef.current.muted = newMutedState;
        setIsMuted(newMutedState);
      }
    }
  };

  return (
    <>
      <audio ref={audioRef} src={playlistRef.current[currentTrackIndex]}>
        <source type="audio/mpeg" />
      </audio>
      
      <button
        className={`music-player playing ${showPanel ? 'expanded' : ''}`}
        onClick={toggleMute}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        aria-label={isMuted ? "开启音乐" : "静音"}
      >
        {isMuted ? (
          // 静音图标 - music_off
          <svg className="music-icon rotating" viewBox="0 0 24 24" fill="currentColor">
            <path d="M4.27 3L3 4.27l9 9v.28c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4v-1.73L19.73 21 21 19.73 4.27 3zM14 7h4V3h-6v5.18l2 2z"/>
          </svg>
        ) : (
          // 有声音图标 - music_note
          <svg className="music-icon rotating" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
          </svg>
        )}
      </button>

      {/* 音乐控制面板 */}
      {showPanel && (
        <div 
          className="music-panel" 
          onMouseEnter={handlePanelMouseEnter}
          onMouseLeave={handlePanelMouseLeave}
        >
          <div className="music-panel-header">
            <h3>正在播放</h3>
            <button className="close-btn" onClick={() => setShowPanel(false)}>×</button>
          </div>
          
          <div className="current-track">
            <div className="track-name">{getFileName(playlistRef.current[currentTrackIndex] || '')}</div>
            <div className="track-number">{currentTrackIndex + 1} / {playlistRef.current.length}</div>
          </div>

          <div className="progress-container">
            <span className="time-label">{formatTime(currentTime)}</span>
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={(e) => seekTo(Number(e.target.value))}
              className="progress-bar"
              style={{
                '--progress': `${duration > 0 ? (currentTime / duration) * 100 : 0}%`
              } as React.CSSProperties & { '--progress': string }}
            />
            <span className="time-label">{formatTime(duration)}</span>
          </div>

          <div className="controls">
            <button className="control-btn" onClick={playPrevTrack} title="上一首">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
              </svg>
            </button>
            <button className="control-btn play-btn" onClick={togglePlayPause} title={isPlaying ? "暂停" : "播放"}>
              {isPlaying ? (
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              )}
            </button>
            <button className="control-btn" onClick={playNextTrack} title="下一首">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
              </svg>
            </button>
            
            {/* 音量控制按钮 */}
            <div 
              className="volume-control-wrapper"
              onMouseEnter={() => {
                if (volumeTimerRef.current) {
                  clearTimeout(volumeTimerRef.current);
                }
                setShowVolumeSlider(true);
              }}
              onMouseLeave={() => {
                volumeTimerRef.current = setTimeout(() => {
                  setShowVolumeSlider(false);
                }, 400);
              }}
            >
              <button 
                className="control-btn volume-btn" 
                title={`音量: ${Math.round(volume * 100)}%`}
                onClick={() => {
                  // 点击切换静音/取消静音
                  if (volume > 0) {
                    changeVolume(0);
                  } else {
                    changeVolume(0.3);
                  }
                }}
              >
                <svg className="volume-icon-small" viewBox="0 0 24 24" fill="currentColor">
                  {volume === 0 ? (
                    <path d="M16.5 12A4.5 4.5 0 0014 7.97v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0021 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 003.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                  ) : volume < 0.5 ? (
                    <path d="M7 9v6h4l5 5V4l-5 5H7z"/>
                  ) : (
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0014 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                  )}
                </svg>
              </button>
              
              {/* 竖向音量滑块 */}
              {showVolumeSlider && (
                <div className="volume-slider-vertical">
                  <div className="volume-percentage">{Math.round(volume * 100)}%</div>
                  
                  {/* 自定义竖向滑块 */}
                  <div 
                    className="custom-volume-slider"
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const y = e.clientY - rect.top;
                      const percentage = 1 - (y / rect.height); // 从下到上
                      changeVolume(Math.max(0, Math.min(1, percentage)));
                    }}
                  >
                    {/* 滑轨 */}
                    <div className="slider-track"></div>
                    
                    {/* 已填充部分 */}
                    <div 
                      className="slider-fill" 
                      style={{ height: `${volume * 100}%` }}
                    ></div>
                    
                    {/* 滑块按钮 */}
                    <div 
                      className="slider-thumb"
                      style={{ bottom: `${volume * 100}%` }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        const startY = e.clientY;
                        const startVolume = volume;
                        const sliderHeight = e.currentTarget.parentElement!.clientHeight;
                        
                        const handleMouseMove = (moveEvent: MouseEvent) => {
                          const deltaY = startY - moveEvent.clientY;
                          const deltaVolume = deltaY / sliderHeight;
                          const newVolume = Math.max(0, Math.min(1, startVolume + deltaVolume));
                          changeVolume(newVolume);
                        };
                        
                        const handleMouseUp = () => {
                          document.removeEventListener('mousemove', handleMouseMove);
                          document.removeEventListener('mouseup', handleMouseUp);
                        };
                        
                        document.addEventListener('mousemove', handleMouseMove);
                        document.addEventListener('mouseup', handleMouseUp);
                      }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="playlist">
            <div className="playlist-header">播放列表</div>
            <div className="playlist-items">
              {playlistRef.current.map((track, index) => (
                <div
                  key={index}
                  className={`playlist-item ${index === currentTrackIndex ? 'active' : ''}`}
                  onClick={() => playTrack(index)}
                >
                  <span className="track-index">{index + 1}</span>
                  <span className="track-title">{getFileName(track)}</span>
                  {index === currentTrackIndex && isPlaying && (
                    <svg className="playing-icon" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                    </svg>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Floating particle component
const Particles = React.memo(function Particles() {
  const particles = Array.from({ length: 30 }, (_, i) => {
    const size = Math.random() * 12 + 6; // 增大尺寸：6-18px
    const left = Math.random() * 100;
    const duration = Math.random() * 12 + 10; // 加快速度：10-22秒
    const delay = Math.random() * 8;
    const colors = [
      "rgba(255, 183, 197, 0.7)", // 提高透明度
      "rgba(123, 154, 216, 0.65)",
      "rgba(200, 180, 255, 0.6)",
      "rgba(255, 210, 220, 0.65)",
      "rgba(170, 200, 255, 0.6)",
      "rgba(255, 150, 180, 0.7)", // 新增更鲜艳的颜色
      "rgba(180, 140, 255, 0.65)",
    ];
    const color = colors[i % colors.length];

    return (
      <div
        key={i}
        className="particle"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          left: `${left}%`,
          background: color,
          boxShadow: `0 0 ${size * 0.8}px ${color}`, // 添加发光效果
          animationDuration: `${duration}s`,
          animationDelay: `${delay}s`,
        }}
      />
    );
  });

  return <>{particles}</>;
});

// Copy icon SVG
function CopyIcon({ copied }: { copied: boolean }) {
  if (copied) {
    return (
      <svg className="copy-icon" viewBox="0 0 24 24">
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
      </svg>
    );
  }
  return (
    <svg className="copy-icon" viewBox="0 0 24 24">
      <path d="M16 1H4C2.9 1 2 1.9 2 3V17H4V3H16V1ZM19 5H8C6.9 5 6 5.9 6 7V21C6 22.1 6.9 23 8 23H19C20.1 23 21 22.1 21 21V7C21 5.9 20.1 5 19 5ZM19 21H8V7H19V21Z" />
    </svg>
  );
}

// Download icon SVG with gradient
function DownloadIcon() {
  return (
    <svg
      style={{
        width: "20px",
        height: "20px",
        marginRight: "8px",
        position: "relative",
        zIndex: 2,
      }}
      viewBox="0 0 24 24"
    >
      <defs>
        <linearGradient id="iconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: "#5A76A8", stopOpacity: 1 }} />
          <stop
            offset="100%"
            style={{ stopColor: "#4A5F8C", stopOpacity: 1 }}
          />
        </linearGradient>
      </defs>
      <path
        fill="url(#iconGradient)"
        d="M19,9H15V3H9V9H5L12,16L19,9M5,18V20H19V18H5Z"
      />
    </svg>
  );
}

// Small download icon for history
function SmallDownloadIcon() {
  return (
    <svg
      style={{ width: "16px", height: "16px", fill: "#cbd5e0" }}
      viewBox="0 0 24 24"
    >
      <path d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z" />
    </svg>
  );
}

// Password item component
function PasswordItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCopy = useCallback(() => {
    navigator.clipboard
      .writeText(value)
      .then(() => {
        setCopied(true);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          setCopied(false);
        }, 2000);
      })
      .catch((err) => {
        console.error("复制失败:", err);
      });
  }, [value]);

  return (
    <div
      className={`pass-item ${copied ? "copied" : ""}`}
      onClick={handleCopy}
    >
      <div className="tooltip">已复制 ✓</div>
      <span className="pass-label">{label}</span>
      <div className="pass-value-row">
        <span className="pass-code">{value}</span>
        <CopyIcon copied={copied} />
      </div>
    </div>
  );
}

// History versions data
const historyVersions = [
  {
    version: "v1.2.3 (Stable)",
    url: "https://wwbed.lanzoul.com/b01884b8tg",
  },
  {
    version: "v1.2.2",
    url: "https://wwbed.lanzoul.com/b0188387xa",
  },
];

export function App() {
  const [isHovering, setIsHovering] = useState(false);

  // Add a subtle mouse-follow glow effect
  const containerRef = useRef<HTMLDivElement>(null);
  const [glowPos, setGlowPos] = useState({ x: 50, y: 50 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setGlowPos({ x, y });
      }
    };

    const el = containerRef.current;
    if (el) {
      el.addEventListener("mousemove", handleMouseMove);
      return () => el.removeEventListener("mousemove", handleMouseMove);
    }
  }, []);

  return (
    <>
      {/* Music Player */}
      <MusicPlayer />

      {/* Decorative background orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      {/* Background layers */}
      <div className="bg-pattern" />
      <div className="bg-pickup" />

      {/* Floating particles */}
      <Particles />

      {/* Main content */}
      <div className="main-layout">
        <div
          ref={containerRef}
          className="container-card"
          style={{
            background: isHovering
              ? `radial-gradient(circle at ${glowPos.x}% ${glowPos.y}%, rgba(255,200,215,0.12) 0%, rgba(245,248,255,0.62) 50%)`
              : undefined,
          }}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          {/* Title */}
          <h1 className="main-title">渡幕 (Trans-Jimaku)</h1>
          <div className="subtitle">同人音声沉浸式 AI 翻校工具</div>

          {/* Download card */}
          <div className="download-card">
            <span className="version-tag">
              <span>最新公测版</span>
            </span>

            <div className="version-info">
              <span className="version-title">v1.2.5</span>
              <span className="version-date">更新于 2026-02-06</span>
            </div>

            <div className="password-grid">
              <PasswordItem label="访问密码" value="大家翻" />
              <PasswordItem label="解压密码" value="新妻ひより" />
            </div>

            <a
              href="https://wwbed.lanzoul.com/b01884k1ed"
              className="download-btn"
              target="_blank"
              rel="noopener noreferrer"
            >
              <DownloadIcon />
              <span>立即下载 v1.2.5</span>
            </a>
          </div>

          {/* History versions */}
          <div className="history-section">
            <div className="history-title-text">历史版本 / BACKUP</div>

            <div className="history-list">
              {historyVersions.map((item) => (
                <a
                  key={item.version}
                  href={item.url}
                  className="history-link"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span>{item.version}</span>
                  <SmallDownloadIcon />
                </a>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="footer">
            <a
              href="https://afdian.com/a/yuuriyakuki"
              target="_blank"
              rel="noopener noreferrer"
            >
              ⚡ 爱发电
            </a>
            <span style={{ color: "#CBD5E0" }}>|</span>
            <a
              href="https://space.bilibili.com/3546921813674876"
              target="_blank"
              rel="noopener noreferrer"
            >
              📺 Bilibili
            </a>
            <div className="copyright">© 2026 幽离译归</div>
          </div>
        </div>
      </div>
    </>
  );
}
