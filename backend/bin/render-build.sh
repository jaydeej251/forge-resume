#!/usr/bin/env bash
# exit on error
set -o errexit

bundle install
# Free web services have no pre-deploy command — migrate during build.
bundle exec rails db:migrate
