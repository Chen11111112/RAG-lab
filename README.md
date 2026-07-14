# this is my profile
## This is AI-CHAT !
PR - Pull Request
MR - Merge Request

DEV - 0713

# DEBUG
1. F12 Network -> 前端還是後端的問題
2. console.log() -> 後端還是外部服務的問題

# Git操作
git init 創建專案
git branch -M main
git remote add origin https://github.com/Chen11111112/My-First-App.git
git push -u origin main 
---
git clone https://github.com/Chen11111112/My-First-App.git 複製專案
git branch 確認分支
git checkout -b feature/something 創建新分支並切換到該分支上
git add . 確認修改第一次
git commit -m “something dev” 確認修改第二次
git push origin feature/ something 發送PR/MR

# clone
複製一個專案下來後要記得建立本地的.env因為env不會推到git上所以別人也clone不到