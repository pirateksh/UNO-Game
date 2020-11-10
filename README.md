# Galactic UNO Game
A real-time **multi-player UNO Game** with **live video calling** feature developed using **Django Web Framework**, **Django Channels 2**, **Phaser 3**, **Peer.js** and **Bootstrap 5**.

![Image of Homepage](./assets/img/edited2.png?raw=true)

## How to run locally?
* Clone the Repository.
* Make a virtual environment `python -m venv <envname>`
* If you are using Linux, run `source <envname>/bin/activate` to activate the virtual environment.
* Run `pip install -r requirements.txt` to install the dependencies.
* Install **redis**. If you are using *Ubuntu 20.04*, take help from <a href="https://www.digitalocean.com/community/tutorials/how-to-install-and-secure-redis-on-ubuntu-20-04">this</a> link otherwise take help from *Google*.
* Run `sudo npm install peer -g`. You will also need to install **npm** if it's not already there.
* Run `python manage.py makemigrations`.
* Run `python manage.py migrate`.
* Run `python manage.py runserver` to start the server.
* On another terminal, run `peerjs --port 8001` to start peerjs server.
* Now you are good to go, visit `http://localhost:8000`.

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
* <a href="https://github.com/pirateksh">Kshitiz Srivastava</a>
* <a href="https://github.com/ankitsangwan1999">Ankit Sangwan</a>
* <a href="https://github.com/vishu6361">Vishwajeet Kumar</a>
