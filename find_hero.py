import re

with open('css/style.css', 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace('../assets/', '/assets/')
c = re.sub(r'([\'"])assets/', r'\1/assets/', c)

with open('next-app/src/app/globals.css', 'w', encoding='utf-8') as f:
    f.write(c)

print('Done globals.css length:', len(c))
