import sys
import pandas as pd
import json
import os
from bs4 import BeautifulSoup
import requests
import urllib.request
import shutil


# From https://apps.irs.gov/app/picklist/list/priorFormPublication.html search for forms that match exactly and the title, min max year it was available
# In pretty Json format

#within a range of year download all the pdf of the forms

#The website does not have API so used two methods, one web manuplation and the other is parsing the HTML

class scrappy:
    url = "https://apps.irs.gov/app/picklist/list/priorFormPublication.html"
    def __init__(self, form, yearRange = None):
        s = form.split(',')                     #pass as strings
        formList = list()

        for f in s:
            f = f.strip().replace(' ', '+')     #strip() so there can be trailing space in input
            if yearRange != None:
                year = yearRange.split('-')
                downLoadPDF(f, year)            #For part 2
            else:
                formList.append(printJsonValue(f))  #For part 1
        if len(formList) !=0:
            writeToFile(formList)

def printJsonValue(form): #using the URL manipulation
    url = f"https://apps.irs.gov/app/picklist/list/priorFormPublication.html?resultsPerPage=200&sortColumn=sortOrder&indexOfFirstRow=0&criteria=formNumber&value={form}&isDescending=false"
    table = pd.read_html(url)                   #retrieve all the tables in the url
    formdi = dict()
    start = 0
    for i in range(len(table[3]['Product Number'])):        #table wanted is the [3]
        if (form.replace('+', ' ').lower() == table[3]['Product Number'][i].lower()):
            formdi['form_number'] = table[3]['Product Number'][i]
            formdi['form_title'] = table[3]['Title'][i]
            formdi['min_year'] = int(table[3]['Revision Date'][i])  #form already sorted so at the end it be the min year
            if start == 0:
                formdi['max_year'] = int(table[3]['Revision Date'][i])
                start = 1
    return formdi

def writeToFile(formList):
    with open('jsonView.json', 'w') as li:
        json.dump(formList, li, indent=4)

def downLoadPDF(form, year): #Parse the HTML from the website
    url = f"https://apps.irs.gov/app/picklist/list/priorFormPublication.html?resultsPerPage=200&sortColumn=sortOrder&indexOfFirstRow=0&criteria=formNumber&value={form}&isDescending=false"
    rq = requests.get(url)
    if rq.status_code == 200:
        soup = BeautifulSoup(rq.text,'html.parser')
        table = soup.find('table',{'class' : 'picklist-dataTable'}) #This get the table of wanted content
        links = dict()
        for tr in table.find_all('tr')[1::]: #this is for every row of table except the first
            tds = tr.find_all('td')
            add = False
            temp = dict()
            href = ""
            for p in tds:                   #the column of the row
                if p['class'] == ['LeftCellSpacer']:
                    if p.text.lower().strip() == form.replace('+', ' ').lower():
                        href= f"{p.find('a')['href']}"
                if p['class'] == ['EndCellSpacer']:
                    if len(year) == 1:
                        if int(p.text) == int(year[0]):
                            add = True
                            temp[href] = int(p.text)  # using the link as keys
                    else:
                        if int(p.text) >= int(year[0]) and int(p.text) <= int(year[1]):
                            add = True
                            temp[href] = int(p.text)
            if add:
                links.update(temp)
        if links.get(''):
            del links['']
        for k,v in links.items():
            downLoad(form, k,v)

def downLoad(form, url, year):
    rename = f"{form.replace('+',' ')} - {year}.pdf"
    urllib.request.urlretrieve(url, f"./formDownloads/{rename}")

def main():
    if (len(sys.argv) >= 3):
        if len(sys.argv) == 4 and sys.argv[3] == 'T':
            shutil.rmtree('./formDownloads', ignore_errors=True)
            os.mkdir('formDownloads')
        downLoad = scrappy(sys.argv[1], sys.argv[2])
    else:
        json = scrappy(sys.argv[1])

if os.path.exists('formDownloads') == False:
    os.mkdir('formDownloads')
main()