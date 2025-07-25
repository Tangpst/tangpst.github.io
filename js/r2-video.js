// source/js/r2-video.js
document.addEventListener('DOMContentLoaded', () => {
  const initR2Video = async (container) => {
    const filename = container.dataset.filename;
    const attributes = JSON.parse(container.dataset.attributes || '{}');
    const video = container.querySelector('.r2-private-video');
    const overlay = container.querySelector('.r2-video-overlay');
    const loading = container.querySelector('.r2-video-loading');
    const playBtn = container.querySelector('.r2-video-play');
    const errorDisplay = container.querySelector('.r2-video-error');
    const retryBtn = container.querySelector('.r2-retry-btn');
    
    // 初始状态
    let isLoading = false;
    let videoUrl = null;
    
    // 获取预签名URL
    const getSignedUrl = async () => {
      try {
        const res = await fetch(`/r2/presign?file=${encodeURIComponent(filename)}`);
        
        if (!res.ok) {
          throw new Error(`请求失败: ${res.status}`);
        }
        
        return await res.json();
      } catch (error) {
        console.error('获取视频URL失败:', error);
        throw error;
      }
    };
    
    // 加载视频源
    const loadVideoSource = async () => {
      try {
        // 显示加载状态
        isLoading = true;
        loading.style.display = 'flex';
        playBtn.style.display = 'none';
        errorDisplay.style.display = 'none';
        
        // 获取签名URL
        const { url } = await getSignedUrl();
        videoUrl = url;
        
        // 设置视频源
        const source = video.querySelector('source');
        source.src = url;
        video.load();
        
        // 设置封面图（如果有）
        if (attributes.poster) {
          try {
            const posterRes = await fetch(`/r2/presign?file=${encodeURIComponent(attributes.poster)}`);
            const { url: posterUrl } = await posterRes.json();
            video.poster = posterUrl;
          } catch {
            // 封面加载失败不影响主视频
          }
        }
        
        // 等待视频数据加载
        await new Promise((resolve, reject) => {
          const handleLoaded = () => {
            video.removeEventListener('loadedmetadata', handleLoaded);
            resolve();
          };
          
          video.addEventListener('loadedmetadata', handleLoaded);
          video.addEventListener('error', (e) => {
            reject(new Error('视频加载失败'));
          });
          
          setTimeout(() => {
            reject(new Error('视频加载超时'));
          }, 10000);
        });
        
        // 应用初始属性
        if (attributes.autoplay) {
          video.autoplay = true;
          container.classList.add('playing');
        }
        if (attributes.loop) video.loop = true;
        if (attributes.muted) video.muted = true;
        
        // 标记为已加载
        container.classList.add('loaded');
      } catch (error) {
        console.error('视频加载错误:', error);
        
        // 显示错误状态
        errorDisplay.style.display = 'block';
        loading.style.display = 'none';
        
        // 错误重试按钮
        retryBtn.onclick = retryLoading;
      } finally {
        isLoading = false;
      }
    };
    
    // 处理重试
    const retryLoading = () => {
      if (!isLoading) {
        loadVideoSource();
      }
    };
    
    // 播放按钮点击
    playBtn.addEventListener('click', () => {
      if (!videoUrl) {
        loadVideoSource();
      } else {
        video.play();
        container.classList.add('playing');
        playBtn.style.display = 'none';
      }
    });
    
    // 视频播放事件
    video.addEventListener('play', () => {
      container.classList.add('playing');
    });
    
    video.addEventListener('pause', () => {
      if (attributes.autoplay) return;
      container.classList.remove('playing');
    });
    
    // 错误处理
    video.addEventListener('error', () => {
      console.error('视频播放错误');
      errorDisplay.style.display = 'block';
      loading.style.display = 'none';
      playBtn.style.display = 'none';
    });
    
    // 自动加载策略
    if (attributes.autoplay) {
      // 自动播放的视频：使用IntersectionObserver
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            loadVideoSource();
            observer.disconnect();
          }
        },
        {
          root: null,
          rootMargin: '100px 0px',
          threshold: 0.01
        }
      );
      
      observer.observe(container);
    } else {
      // 非自动播放：显示播放按钮
      playBtn.style.display = 'flex';
      loading.style.display = 'none';
    }
  };
  
  // 初始化所有视频组件
  const videoContainers = document.querySelectorAll('.r2-video-container');
  
  if (videoContainers.length > 0) {
    videoContainers.forEach(initR2Video);
  }
});