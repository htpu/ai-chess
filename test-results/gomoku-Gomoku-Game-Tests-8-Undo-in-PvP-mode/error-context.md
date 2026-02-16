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
      - generic [ref=e10]: ○
      - generic [ref=e11]: "当前: 白方"
    - generic [ref=e239]:
      - button "New Game" [ref=e240] [cursor=pointer]
      - button "Undo" [ref=e241] [cursor=pointer]
      - button "Resign" [ref=e242] [cursor=pointer]
    - generic [ref=e243]:
      - generic [ref=e244]:
        - generic [ref=e245]: "Mode:"
        - combobox "Mode:" [ref=e246]:
          - option "PvP" [selected]
          - option "PvC"
      - generic [ref=e247]:
        - generic [ref=e248]: "Difficulty:"
        - combobox "Difficulty:" [ref=e249]:
          - option "Easy"
          - option "Medium" [selected]
          - option "Hard"
```