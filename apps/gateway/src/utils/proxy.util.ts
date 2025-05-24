/**
 * Hàm tạo và xử lý proxy request đến service đích
 * @param targetBaseUrl URL cơ sở của service đích (không bao gồm path)
 * @param request Request gốc từ client
 * @param path Path cụ thể (phần sau baseUrl)
 * @returns Response từ service đích
 */
export async function proxyRequest(
  targetBaseUrl: string,
  request: Request,
  path: string
): Promise<Response> {
  try {
    // Xây dựng URL đích đầy đủ
    const targetUrl = `http://${targetBaseUrl}/${path}`;
    
    // Tạo request mới để gửi đến service đích
    const proxyResponse = await fetch(targetUrl, {
      method: request.method,
      headers: request.headers,
      body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
    });
    
    // Tạo response để trả về cho client
    const response = new Response(proxyResponse.body, {
      status: proxyResponse.status,
      statusText: proxyResponse.statusText,
      headers: proxyResponse.headers,
    });
    
    return response;
  } catch (error) {
    console.error('[Proxy Error]:', error);
    
    // Trả về lỗi nếu không thể kết nối đến service đích
    return new Response(
      JSON.stringify({
        error: 'Service unavailable',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
