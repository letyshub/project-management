import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { authGuard, guestGuard } from './auth.guard';
import { AuthService } from './auth.service';

describe('Auth Guards', () => {
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;
  const mockUrlTree = {} as UrlTree;

  beforeEach(() => {
    mockAuthService = jasmine.createSpyObj('AuthService', ['isAuthenticated']);
    mockRouter = jasmine.createSpyObj('Router', ['createUrlTree']);
    mockRouter.createUrlTree.and.returnValue(mockUrlTree);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
      ],
    });
  });

  describe('authGuard', () => {
    it('should allow access when authenticated', () => {
      mockAuthService.isAuthenticated.and.returnValue(true);

      const result = TestBed.runInInjectionContext(() =>
        authGuard({} as any, {} as any)
      );

      expect(result).toBe(true);
    });

    it('should redirect to login when not authenticated', () => {
      mockAuthService.isAuthenticated.and.returnValue(false);

      const result = TestBed.runInInjectionContext(() =>
        authGuard({} as any, {} as any)
      );

      expect(result).toBe(mockUrlTree);
      expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/auth/login']);
    });
  });

  describe('guestGuard', () => {
    it('should allow access when not authenticated', () => {
      mockAuthService.isAuthenticated.and.returnValue(false);

      const result = TestBed.runInInjectionContext(() =>
        guestGuard({} as any, {} as any)
      );

      expect(result).toBe(true);
    });

    it('should redirect to projects when authenticated', () => {
      mockAuthService.isAuthenticated.and.returnValue(true);

      const result = TestBed.runInInjectionContext(() =>
        guestGuard({} as any, {} as any)
      );

      expect(result).toBe(mockUrlTree);
      expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/projects']);
    });
  });
});
