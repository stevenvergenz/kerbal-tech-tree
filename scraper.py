#!/bin/env python3

from urllib import request, parse as urlparse
from xml.etree import ElementTree as ET
from os import path as libpath
import json

rootUrl = 'http://wiki.kerbalspaceprogram.com/wiki/Technology_tree'

def main(argv):

	#try:
	#	data = request.urlopen(rootUrl).read()
	#except URLError as e:
	#	print(e)
	#	return
	#with open('techtree.html', 'w') as ofp:
	#	ofp.write(str(data, 'utf8'))

	data = ''
	with open('techtree.html', 'r') as f:
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
				#with open(libpath.join('.','icons', techId), 'wb') as fp:
				#	fp.write(request.urlopen( urlparse.urljoin(rootUrl, iconUrl) ).read())

			elif headers[i] in ['dependencies','dependents']:
				tech[headers[i]] = [item.get('href')[1:] for item in col.findall('./ul/li/a')]

			elif headers[i] == 'parts':
				# don't scrape parts list yet
				pass

			else:
				tech[headers[i]] = col.text.strip()

		data[techId] = tech


	# dump to file
	with open('techs.json', 'w') as fp:
		json.dump(data, fp, indent='\t')


if __name__ == '__main__':
	import sys
	main(sys.argv)