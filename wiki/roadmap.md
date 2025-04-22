# Project-Roadmap

## Planned features

### Robots & World

- [ ] Robot skins/hats, accessible via method `anziehen(Text outfit)`
  - [ ] Top hat; `"Zylinder"`
  - [ ] Baseball cap; `"Kappe"`
- [ ] Add speech bubbles, accessible via method `sprechen(Text aussage)`
- [ ] More complex success conditions in tasks

### Language features

- [ ] Implement more Pythonic object instantiation like so `Klasse obj sei Klasse()`
  - [ ] Implement type checking objects
    - [ ] As function arguments
    - [ ] In assignments
- [ ] Floating point numbers like `Kommazahl x sei 1.52`
- [ ] More mathematical operations like exponents `^`, degrees `°` (calculates radians), etc.
  - [ ] Allow post-fix unary operators
- [ ] MAYBE: More built-in functions, like `sin`, `cos`, `tan`, `abs`, ...
- [ ] MAYBE: 2-integer based rational numbers like `Bruch x sei 2_1/3`
  - [ ] Typing: `Kommazahl + Zahl = Kommazahl`, `Kommazahl + Bruch = Kommazahl`, `Bruch + Zahl = Bruch`
- [ ] Allow `==`, `>=`, `<=`, `!=` and `<>`
- [ ] MAYBE: allow `+=` and `-=`, (EXTRA MAYBE: `*=` and `:=`)
- [ ] MAYBE: allow increments & decrements `++` and `--`
- [ ] MAYBE: try-catch blocks like `versuche ... sonst ... ende` or `versuche ... ende`
  - [ ] Implement structogram visualization
  - [ ] Implement flowchart visualization
- [ ] EXTRA MAYBE: Shorthand for `wiederhole` as `wdh.`