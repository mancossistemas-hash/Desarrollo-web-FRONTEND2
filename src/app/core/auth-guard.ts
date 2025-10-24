import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const token = auth.getToken();
  if (!token) {
    router.navigate(['/login'], { queryParams: { r: state.url } });
    return false;
  }
  const allowed: string[] | undefined = route.data?.['roles'];
  if (allowed?.length) {
    const role = auth.getRole();
    if (!role || !allowed.includes(role)) {
      router.navigate(['/dashboard']);
      return false;
    }
  }
  return true;
};
