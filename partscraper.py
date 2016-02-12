#!/bin/env python3

from urllib import request, parse as urlparse
from xml.etree import ElementTree as ET
from html.parser import HTMLParser
import json, re


class InfoboxParser(HTMLParser):

	def __init__(self):
		super().__init__(self)
		self.props = {}
		self.state = []

		self.cellContents = ''
		self.rowContents = []
		self.prevRowContents = None
		self.rowSpan = 0

	def handle_starttag(self, tag, attrsList):
	
		# convert list of pairs to lookup table
		attrs = {}
		for i in attrsList:
			attrs[i[0]] = i[1]

		# start state machine
		if len(self.state) == 0 and tag == 'div' and attrs.get('class') == 'infobox':
			self.state.append('infobox')

		elif len(self.state) > 0:

			# start row
			if self.state[-1] == 'infobox' and tag == 'tr':
				self.state.append('row')
				self.rowContents = []

			# start cell
			elif self.state[-1] == 'row' and tag == 'td':
				self.state.append('cell')
				self.cellContents = ''
				if self.rowSpan == 0:
					self.rowSpan = int(attrs.get('rowspan', 0))


	def handle_endtag(self, tag):

		if len(self.state) > 0:

			# extract useful info from row once it's been parsed
			if self.state[-1] == 'row' and tag == 'tr' and len(self.rowContents) >= 2:
				if self.rowSpan == 2:
					header = ' '.join([x.strip() for x in self.rowContents[:-1]])
				elif self.rowSpan == 1:
					header = self.prevRowContents[0].strip() + ' ' + self.rowContents[0].strip()
				else:
					header = self.rowContents[0].strip()

				self.props[header] = self.rowContents[-1].strip()
				self.prevRowContents = self.rowContents
				self.rowSpan = max(0, self.rowSpan-1)

			elif self.state[-1] == 'cell' and tag == 'td':
				self.rowContents.append(self.cellContents.strip())

			# selectively pop from state on close
			try:
				if ['infobox','row','cell'].index(self.state[-1]) == ['div','tr','td'].index(tag):
					self.state = self.state[:-1]
			except ValueError:
				pass

	def handle_data(self, data):

		# record ALL text inside a cell, including subelements
		if len(self.state) > 0 and self.state[-1] == 'cell':
			self.cellContents += data

# end class

def getPart(url, local=False):

	# fetch
	data = ''
	name = urlparse.urlparse(url).path.split('/')[-1]
	if local:
		with open('cached/{}.html'.format(name), 'r') as sample:
			data = sample.read()
	else:
		print('GET', url)
		data = request.urlopen(url)
		encoding = data.headers['Content-Type'].rpartition('=')[-1]
		data = data.read().decode(encoding)

		with open('cached/{}.html'.format(name), 'w', encoding=encoding) as outfile:
			outfile.write(data)

	parser = InfoboxParser()
	parser.feed(data)
	return parser.props


if __name__ == '__main__':
	print(json.dumps(getPart('', local=True), indent=4))
