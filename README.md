# UNO Game

## How to run?
* Clone the Repository.
* Make a virtual environment `python -m venv <envname>`
* If you are using Linux, run `source <envname>/bin/activate` to activate the virtual environment.
* Run `pip install -r requirements.txt` to install the dependencies.
* Run `python manage.py migrate`.
* Run `python manage.py makemigrations`.
* Again run `python manage.py migrate`.
* Now you are good to go. Run `python manage.py runserver` to start the server.

## How to Contribute?
* Fork the repository (If you are not a collaborator).
* Clone this repository / forked repository and follow the steps mentioned in **_How to Run?_**.
* Create a new git branch using `git branch <branch-name>`.
* Checkout to new branch using `git checkout <branch-name>`.
* Make the changes to project.
* Run `git add .`.
* Commit using `git commit -m <commit-message>`.
* Checkout to **main** branch using `git checkout main`.
* **Pull** the recent changes using `git pull origin main`.
* Merge your branch using `git merge <branch-name>`.
* Resolve merge-conflicts (if any).
* After successful merging of the branches, push your changes to github using `git push origin main`.
* Switch back to your branch using `git checkout <branch-name>`.
* Merge with **main** using `git merge main` so that recent changes are reflected in your branch.
* If you had forked the repository (i.e. you are not a Collaborator), open a **Pull Request** from the forked repository.

## Contributors - Team Django Unchained
* Kshitiz Srivastava
* Ankit Sangwan
* Vishwajeet Kumar
