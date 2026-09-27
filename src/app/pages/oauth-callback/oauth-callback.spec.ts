import { OauthCallback } from './oauth-callback';

describe('OauthCallback', () => {
  let mockPostMessage: ReturnType<typeof vi.fn>;
  let mockClose: ReturnType<typeof vi.fn>;
  let closeSpy: ReturnType<typeof vi.spyOn>;
  let OriginalBroadcastChannel: typeof BroadcastChannel;
  let channelNames: string[];

  beforeEach(() => {
    vi.restoreAllMocks();
    OriginalBroadcastChannel = globalThis.BroadcastChannel;
    channelNames = [];

    mockPostMessage = vi.fn();
    mockClose = vi.fn();
    closeSpy = vi.spyOn(window, 'close').mockImplementation(() => {});

    function MockChannel(this: { postMessage: unknown; close: unknown }, name: string) {
      channelNames.push(name);
      this.postMessage = mockPostMessage;
      this.close = mockClose;
    }

    vi.stubGlobal('BroadcastChannel', MockChannel as unknown as typeof BroadcastChannel);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    globalThis.BroadcastChannel = OriginalBroadcastChannel;
  });

  it('should notify with an auth-success message via BroadcastChannel', () => {
    const component = new OauthCallback();
    component.ngOnInit();

    expect(channelNames).toContain('auth');
    expect(mockPostMessage).toHaveBeenCalledWith({ type: 'auth-success' });
    expect(mockClose).toHaveBeenCalled();
    expect(closeSpy).toHaveBeenCalled();
  });

  it('should close the window after sending the message', () => {
    const component = new OauthCallback();
    component.ngOnInit();

    expect(closeSpy).toHaveBeenCalled();
  });

  it('should handle multiple calls gracefully', () => {
    const component = new OauthCallback();
    component.ngOnInit();
    component.ngOnInit();

    expect(mockPostMessage).toHaveBeenCalledTimes(2);
    expect(closeSpy).toHaveBeenCalledTimes(2);
  });
});
