# 本專案使用方法
參考：[說明文件](https://hyc.eshachem.com/program/llm-agent/8-%e5%9c%a8-next-js-%e4%b8%ad%e5%af%a6%e7%8f%be-rag-%e9%80%8f%e9%81%8envidia-nim-supabase-landchain/)  
技術文件參考：[技術文件](https://hackmd.io/@HyC-1029/r1I7wY7Efg)  
  
本專案為RAG範例，透過不同的分支使用不同的方式來實現RAG  
* starter
* feature/local-rag
* feature/supabase-rag

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
