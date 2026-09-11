import { OauthCallback } from './oauth-callback';

describe('OauthCallback', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should notify the opener with an auth-success message', () => {
    const postMessage = vi.fn();
    Object.defineProperty(window, 'opener', { value: { postMessage }, configurable: true });
    const closeSpy = vi.spyOn(window, 'close').mockImplementation(() => {});

    const component = new OauthCallback();
    component.ngOnInit();

    expect(postMessage).toHaveBeenCalledWith({ type: 'auth-success' }, window.location.origin);
    expect(closeSpy).toHaveBeenCalled();
  });

  it('should close the window when there is no opener', () => {
    Object.defineProperty(window, 'opener', { value: null, configurable: true });
    const closeSpy = vi.spyOn(window, 'close').mockImplementation(() => {});

    const component = new OauthCallback();
    expect(() => component.ngOnInit()).not.toThrow();
    expect(closeSpy).toHaveBeenCalled();
  });
});
