# creating new a new quiz
- create a new branch with command: git branch <name>
- switch to branch with command: git checkout <name>
- modify questions.json and quiz_config.json
- commit changes to branch with command: git commit -m "this is a commit message"

# updating codebase
- checkout master branch with command: git checkout main
- add changes to master branch and commit

# merging changes into each quiz branch
- git checkout <branch-name>
- git merge master
- repeat for all branches
