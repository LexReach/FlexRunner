# FlexRunner 📦

> **Amazon Flex Package Organizer** - A mobile-optimized web app for delivery drivers

FlexRunner helps Amazon Flex delivery drivers organize packages into car zones before starting their delivery routes, making the delivery process faster and more efficient.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![PWA Ready](https://img.shields.io/badge/PWA-ready-brightgreen.svg)
![Mobile First](https://img.shields.io/badge/mobile-first-orange.svg)

## ✨ Features

### 📱 Core Functionality
- **Package Range Selection** - Support for 20, 35, or 50 package routes
- **Visual Car Zone Assignment** - 5 zones: Passenger Seat, Back Left, Back Middle, Back Right, Trunk
- **Quick Add Numpad** - Rapid package entry with visual and haptic feedback
- **Delivery Tracking** - Mark packages as delivered with undo capability
- **Progress Statistics** - Real-time tracking of delivered vs remaining packages

### 🎨 User Experience
- **Dark & Light Modes** - Automatic theme switching with persistent preference
- **Haptic Feedback** - Touch vibration for all interactions
- **Sound Effects** - Optional audio feedback for successful actions
- **Toast Notifications** - Non-intrusive feedback with undo actions
- **Custom Modals** - Styled confirmation dialogs (no native alerts)
- **First-time Help** - Interactive tutorial for new users

### ♿ Accessibility
- **Full ARIA Support** - Comprehensive screen reader compatibility
- **Keyboard Navigation** - Complete keyboard control with shortcuts
- **Focus Management** - Clear focus indicators throughout
- **Semantic HTML** - Proper heading hierarchy and landmarks
- **Color Contrast** - WCAG AA compliant color schemes

### 💾 Data Management
- **LocalStorage Persistence** - Automatic state saving
- **Data Export/Import** - JSON backup and restore functionality
- **Error Recovery** - Graceful handling of corrupted data
- **Version Control** - Data format versioning (v10)

### 📲 Progressive Web App
- **Offline Support** - Full functionality without internet connection
- **Add to Home Screen** - Install as a native-like app
- **Service Worker** - Smart caching for performance
- **Mobile Optimized** - Responsive design for all screen sizes
- **Safe Area Support** - Notch-friendly layout for modern devices

## 🚀 Quick Start

### Installation

1. **Clone or download** this repository
2. **Open `index.html`** in a modern web browser
3. **Add to Home Screen** for the best mobile experience

### Development Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/flexrunner.git

# Navigate to the directory
cd flexrunner

# Open in browser (no build step required!)
# Option 1: Double-click index.html
# Option 2: Use a local server (recommended)
python -m http.server 8000
# or
npx serve
```

Visit `http://localhost:8000` in your browser.

## 📖 How to Use

### Step 1: Select Your Package Range
Choose between 20, 35, or 50 packages based on your route.

### Step 2: Load Packages
Two methods available:
- **Tap Selection**: Tap package numbers on the grid
- **Quick Add (⚡)**: Use the numpad for rapid entry

### Step 3: Assign to Zones
Tap a zone on the car visualization to assign selected packages:
- **Passenger Seat** (Blue)
- **Back Left** (Green)
- **Back Middle** (Purple)
- **Back Right** (Orange)
- **Trunk** (Pink)

### Step 4: Start Delivery
Tap **🚚 Start** to switch to delivery mode. Mark packages as delivered by tapping them.

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Shift + ?` | Show help guide |
| `Ctrl/Cmd + D` | Toggle dark/light mode |
| `Esc` | Close modals/overlays |
| `Tab` | Navigate between elements |
| `Enter/Space` | Activate buttons |

## 🏗️ Project Structure

```
FlexRunner/
├── index.html          # Main HTML structure
├── styles.css          # All CSS styles
├── app.js              # Application logic
├── manifest.json       # PWA manifest
├── service-worker.js   # Offline support
├── icon.svg            # App icon
├── tests.html          # Unit tests
└── README.md           # This file
```

## 🧪 Testing

Open `tests.html` in your browser to run unit tests.

```bash
# Using a local server
python -m http.server 8000

# Navigate to:
http://localhost:8000/tests.html
```

All core functions are tested including:
- State management
- Data import/export
- LocalStorage operations
- Package calculations
- Error handling

## 🔧 Configuration

### Customizing Package Ranges

Edit `app.js` to modify available ranges:

```javascript
const ranges = [20, 35, 50]; // Change to [10, 25, 40] for example
```

### Changing Theme Colors

Edit CSS variables in `styles.css`:

```css
:root {
    --amazon-orange: #ff9900;
    --amazon-dark: #232f3e;
    --amazon-darker: #131921;
    --amazon-light: #37475a;
}
```

### Modifying Zones

Edit zone configuration in `app.js`:

```javascript
const zones = {
    passenger: { name: 'Passenger Seat', class: 'passenger' },
    // Add or modify zones here
};
```

## 📊 Browser Support

| Browser | Minimum Version | Notes |
|---------|----------------|-------|
| Chrome/Edge | 88+ | Full support |
| Safari | 14+ | Full support |
| Firefox | 85+ | Full support |
| Samsung Internet | 13+ | Full support |
| Opera | 74+ | Full support |

### Required Browser Features
- ES6+ JavaScript
- CSS Grid & Flexbox
- CSS Custom Properties
- LocalStorage API
- Service Workers (for PWA)
- Web Audio API (optional)
- Vibration API (optional)

## 🐛 Troubleshooting

### Data Not Persisting
- Check if cookies/storage are enabled in browser settings
- Try clearing cache and reloading
- Export data and re-import after reload

### Offline Mode Not Working
- Ensure the app was loaded at least once while online
- Check if Service Workers are enabled in your browser
- Clear cache and reload to re-register Service Worker

### Haptic Feedback Not Working
- Vibration API may not be supported on your device
- Check device vibration settings
- iOS requires user interaction before vibration works

### App Not Installing
- Use HTTPS or localhost (required for PWA)
- Check manifest.json is being served correctly
- Ensure Service Worker is registered successfully

## 🔒 Privacy & Data

- **All data is stored locally** on your device using browser LocalStorage
- **No data is sent to any server** - completely offline capable
- **No analytics or tracking** of any kind
- **No account required** - anonymous usage
- **Data control** - Export and delete your data at any time

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines
- Maintain accessibility standards (ARIA, keyboard navigation)
- Follow existing code style and conventions
- Add JSDoc comments for new functions
- Test on mobile devices
- Update README for new features

## 📝 Changelog

### Version 2.0 (Current)
- ✅ Complete code refactor into modular structure
- ✅ Added comprehensive error handling
- ✅ Implemented full accessibility (ARIA, keyboard navigation)
- ✅ Added data export/import functionality
- ✅ Custom styled modals (no more native alerts)
- ✅ Interactive help/tutorial system
- ✅ PWA support with offline functionality
- ✅ Service Worker for caching
- ✅ Unit test suite
- ✅ Comprehensive documentation
- ✅ Performance optimizations

### Version 1.0
- ✅ Basic package organization
- ✅ Zone assignment
- ✅ Delivery tracking
- ✅ Dark mode
- ✅ Quick add feature

## 📄 License

This project is licensed under the MIT License - see below for details:

```
MIT License

Copyright (c) 2025 FlexRunner

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 🙏 Acknowledgments

- Built for Amazon Flex delivery drivers
- Inspired by the need for efficient package organization
- Icons and emojis from Unicode standard
- Color scheme based on Amazon branding

## 📧 Support

For issues, questions, or suggestions:

1. **Check the troubleshooting section** above
2. **Open an issue** on GitHub with details
3. **Include** browser version, device type, and steps to reproduce

## 🗺️ Roadmap

Future enhancements being considered:

- [ ] Route optimization suggestions
- [ ] Integration with mapping apps
- [ ] Custom zone naming
- [ ] Multi-language support
- [ ] Package photos/notes
- [ ] Delivery time tracking
- [ ] Analytics dashboard
- [ ] Cloud sync (optional)
- [ ] Barcode scanning

---

**Made with ❤️ for delivery drivers everywhere**

*FlexRunner is not affiliated with Amazon or Amazon Flex. It's an independent tool created to help drivers work more efficiently.*
