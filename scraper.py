#!/bin/env python3

from urllib import request, parse as urlparse
from xml.etree import ElementTree as ET
from os import path as libpath
import json

rootUrl = 'http://wiki.kerbalspaceprogram.com/wiki/Technology_tree'

def main(argv):

	if '--local' not in argv:
		try:
			print('GET', rootUrl)
			data = request.urlopen(rootUrl).read()
		except URLError as e:
			print(e)
			return

	else:
		data = ''
		with open('sample_input.html', 'r') as f:
			data = f.read()

	# get largest table on page
	root = ET.fromstring(data)
	tables = root.findall(".//table")
	tmaxsize = 0
	table = None
	for t in tables:
		size = len(t.findall('.//*'))
		if size > tmaxsize:
			tmaxsize = size
			table = t

	# get headers
	headers = ['icon', 'level', 'cost', 'name', 'dependencies', 'dependents', 'parts']
	#for col in table.findall('./tr/th'):
	#	headers.append(col.text.strip())
		
	# get actual techs
	data = {}
	for row in table.findall('./tr[td]'):

		techId = row.get('id')
		tech = {}
		for i, col in enumerate(row.findall('./td')):

			if headers[i] == 'icon':
				iconUrl = col.find('.//img').get('src')
				iconPath = libpath.join('.','icons', techId+iconUrl[-4:])
				if '--local' not in argv:
					with open(iconPath, 'wb') as fp:
						fp.write(request.urlopen( urlparse.urljoin(rootUrl, iconUrl) ).read())
				tech[headers[i]] = iconPath

			elif headers[i] in ['dependencies','dependents']:
				tech[headers[i]] = [item.get('href')[1:] for item in col.findall('./ul/li/a')]

			elif headers[i] == 'parts':
				tech[headers[i]] = [libpath.split(item.get('href'))[1] for item in col.findall('./ul/li/a')]
				# don't scrape parts list yet

			else:
				tech[headers[i]] = col.text.strip()

		if len(tech['parts']) > 0:
			data[techId] = tech


	# dump to file
	with open('techs.json', 'w') as fp:
		json.dump(data, fp, indent='\t', sort_keys=True)


if __name__ == '__main__':
	import sys
	main(sys.argv)
