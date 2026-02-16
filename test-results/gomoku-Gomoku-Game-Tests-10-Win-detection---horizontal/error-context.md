# Page snapshot

```yaml
- generic [ref=e2]:
  - banner [ref=e3]:
    - button "🏠" [ref=e4] [cursor=pointer]
    - heading "● Gomoku ●" [level=1] [ref=e5]
    - combobox [ref=e6]:
      - option "中文"
      - option "EN" [selected]
  - main [ref=e7]:
    - generic [ref=e9]:
      - generic [ref=e10]: ●
      - generic [ref=e11]: "当前: 黑方"
    - generic [ref=e238]:
      - button "New Game" [ref=e239] [cursor=pointer]
      - button "Undo" [ref=e240] [cursor=pointer]
      - button "Resign" [ref=e241] [cursor=pointer]
    - generic [ref=e242]:
      - generic [ref=e243]:
        - generic [ref=e244]: "Mode:"
        - combobox "Mode:" [ref=e245]:
          - option "PvP" [selected]
          - option "PvC"
      - generic [ref=e246]:
        - generic [ref=e247]: "Difficulty:"
        - combobox "Difficulty:" [ref=e248]:
          - option "Easy"
          - option "Medium" [selected]
          - option "Hard"
```