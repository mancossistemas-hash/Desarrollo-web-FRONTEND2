import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');
  
  console.log('🔐 Interceptor ejecutado');
  console.log('📍 URL:', req.url);
  console.log('🎫 Token:', token ? '✅ Existe' : '❌ No existe');
  
  if (token) {
    const clonedReq = req.clone({ 
      setHeaders: { 
        Authorization: `Bearer ${token}` 
      } 
    });
    console.log('✅ Token agregado al header');
    return next(clonedReq);
  }
  
  console.log('⚠️ Request sin token');
  return next(req);
};