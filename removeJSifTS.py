#!/usr/bin/env python
"""Removes JavaScript files that were probably built from a TypeScript file"""

import os

paths = ['.', 'tests']

to_remove = []

for directory in paths:
    for filename in os.listdir(directory):
        filename = os.path.join(directory, filename)
        name, ext = os.path.splitext(filename)
        if ext == '.js' and os.path.exists(name + '.ts'):
            to_remove.append(filename)

print 'going to remove:'
for line in to_remove:
    print line

print
if raw_input('ok?').lower() == 'y':
    for filename in to_remove:
        os.remove(filename)
