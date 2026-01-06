import ctypes
import time
from ctypes import wintypes

# Constants
KEYEVENTF_KEYUP = 0x0002
VK_CONTROL = 0x11
VK_V = 0x56
VK_SHIFT = 0x10
VK_MENU = 0x12

# User32
user32 = ctypes.windll.user32

def paste():
    # Minimized delay for speed, but enough for window switch
    time.sleep(0.1)
    
    # Release Modifiers (Safety)
    user32.keybd_event(VK_SHIFT, 0, KEYEVENTF_KEYUP, 0)
    user32.keybd_event(VK_MENU, 0, KEYEVENTF_KEYUP, 0)
    user32.keybd_event(VK_CONTROL, 0, KEYEVENTF_KEYUP, 0)

    # Tiny buffer for OS to process releases
    time.sleep(0.02) 

    # Press Ctrl
    user32.keybd_event(VK_CONTROL, 0, 0, 0)
    time.sleep(0.01) 

    # Press V
    user32.keybd_event(VK_V, 0, 0, 0)
    time.sleep(0.01) 

    # Release V
    user32.keybd_event(VK_V, 0, KEYEVENTF_KEYUP, 0)
    time.sleep(0.01) 

    # Release Ctrl
    user32.keybd_event(VK_CONTROL, 0, KEYEVENTF_KEYUP, 0)

if __name__ == "__main__":
    paste()
