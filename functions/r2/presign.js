// functions/r2/presign.js
export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const filePath = url.searchParams.get("file");

  if (!filePath) {
    return new Response("缺少文件参数", { status: 400 });
  }

  try {
    // 检测文件类型
    const ext = filePath.split('.').pop().toLowerCase();
    const videoExts = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv'];
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    
    // 根据文件类型设置不同有效期
    let expiresIn = 600; // 默认10分钟
    
    if (videoExts.includes(ext)) {
      expiresIn = 3600; // 视频1小时
    } else if (imageExts.includes(ext)) {
      expiresIn = 1800; // 图片30分钟
    }
    
    // 生成预签名URL
    const signedUrl = await env.R2_BUCKET.getPresignedUrl(
      `https://${env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com/${env.R2_BUCKET.name}/${filePath}`,
      { 
        httpMethod: 'GET', 
        expiresIn
      }
    );

    return new Response(JSON.stringify({ url: signedUrl }), {
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': `max-age=${expiresIn > 300 ? 300 : expiresIn}` 
      }
    });
  } catch (err) {
    return new Response(err.message, { 
      status: 500,
      headers: { 'Cache-Control': 'no-store' }
    });
  }
}