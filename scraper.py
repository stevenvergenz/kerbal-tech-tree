#!/bin/env python3

from urllib import request, parse as urlparse
from xml.etree import ElementTree as ET
from os import path as libpath
import json
import partscraper

rootUrl = 'http://wiki.kerbalspaceprogram.com/wiki/Technology_tree'

def main(argv):

	if '--local' not in argv:
		try:
			print('GET', rootUrl)
			data = request.urlopen(rootUrl)
			encoding = data.headers['Content-Type'].rpartition('=')[-1]
			data = data.read().decode(encoding)

			with open('cached/Technology_tree.html', 'w', encoding=encoding) as outfile:
				outfile.write(data)

		except URLError as e:
			print(e)
			return

	else:
		data = ''
		with open('cached/Technology_tree.html', 'r') as f:
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

			#if headers[i] == 'icon':
			#	iconUrl = col.find('.//img').get('src')
			#	iconPath = libpath.join('.','icons', techId+iconUrl[-4:])
			#	if '--local' not in argv:
			#		with open(iconPath, 'wb') as fp:
			#			fp.write(request.urlopen( urlparse.urljoin(rootUrl, iconUrl) ).read())
			#	tech[headers[i]] = iconPath

			if headers[i] in ['dependencies','dependents']:
				tech[headers[i]] = [item.get('href')[1:] for item in col.findall('./ul/li/a')]

			elif headers[i] == 'parts':

				parts = []
				for item in col.findall('./ul/li/a'):

					url = urlparse.urljoin(rootUrl, item.get('href'))
					props = partscraper.getPart(url, local='--local' in argv)
					parts.append({
						'name': item.text,
						'url': url,
						'props': props
					})


				tech[headers[i]] = parts

			elif headers[i] in ['level', 'cost']:
				tech[headers[i]] = int(col.text.strip())

			else:
				tech[headers[i]] = col.text.strip()

		if len(tech['parts']) > 0:
			data[techId] = tech

	for id,suppldata in json.load(open('techdata.json','r')).items():
		for k,v in suppldata.items():
			data[id][k] = v

	# dump to file
	with open('techs.json', 'w') as fp:
		json.dump(data, fp, indent='\t', sort_keys=True)


if __name__ == '__main__':
	import sys
	main(sys.argv)
