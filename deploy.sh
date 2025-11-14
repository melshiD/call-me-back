#!/bin/bash
set -a
source .env
set +a
raindrop build deploy --amend
