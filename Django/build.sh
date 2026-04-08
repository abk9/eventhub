#!/usr/bin/env bash
set -o errexit

pip install -r requirements.txt

cd Src
python manage.py collectstatic --no-input
python manage.py migrate
