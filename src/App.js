import React, {useState, useEffect} from 'react'
import rp from 'request-promise'
import Button from 'react-bootstrap/Button'
import Card from 'react-bootstrap/Card'
import cheerio from 'cheerio'
import Download from './Download'
import ProgressBar from 'react-bootstrap/ProgressBar'
import Form from 'react-bootstrap/Form'

export default function App() {
  const itcUrl = './data/ProductList_EU_20210210_redux.json'
  let scrapeCounter = 0
  let scrapePerc = 0
  const [isScraping, setScraping] = useState(false)
  const [isLoadingITC, setLoadingITC] = useState(false)
  const [flagITC, setFlagITC] = useState(false)
  const [isLoadedFile, setLoadedFile] = useState('')
  const [isPlatformFilter, setPlatformFilter] = useState('B2X')
  const [isSiteFilter, setSiteFilter] = useState('all')
  const [isTotLines, setTotLines] = useState(0)
  const [isTotScrape, setTotScrape] = useState(0)
  const [isTotB2B, setTotB2B] = useState(0)
  const [isTotB2C, setTotB2C] = useState(0)
  const [isSearchStatus, setSearchStatus] = useState(0)
  const [isProgressBar, setProgressBar] = useState(0)
  const [isProductList, setProductList] = useState([])
  const [isDataFile, setDataFile] = useState({})
  const [isNotFound, setNotFound] = useState({})
  const [isFailed, setFailure] = useState({})
  const handleLoadITC = () => setLoadingITC(true)

  useEffect(() => {
    if (isLoadingITC) {
      loadJSON(itcUrl)
        .then(res => res.json())
        .then(
          (result) => {
            let B2CFilter
            let B2BFilter
            let finalFilter
            if(isPlatformFilter === 'B2X'){
              if(isSiteFilter === 'all'){
                B2CFilter = result.B2C
                B2BFilter = result.B2B
                finalFilter = B2CFilter.concat(B2BFilter)   
              } else {
                B2CFilter = result.B2C.filter(r => r.SITE_CD === isSiteFilter)
                B2BFilter = result.B2B.filter(r => r.SITE_CD === isSiteFilter)
                finalFilter = B2CFilter.concat(B2BFilter)
              } 
            } else {
              if (isSiteFilter === 'all'){
                B2CFilter = result.B2C.filter(r => r.B2C_TYPE_CD === isPlatformFilter)
                B2BFilter = result.B2B.filter(r => r.B2C_TYPE_CD === isPlatformFilter)
                finalFilter = B2CFilter.concat(B2BFilter)   
              } else {
                B2CFilter = result.B2C.filter(r => (r.SITE_CD === isSiteFilter && r.B2C_TYPE_CD === isPlatformFilter))
                B2BFilter = result.B2B.filter(r => r.SITE_CD === isSiteFilter && r.B2C_TYPE_CD === isPlatformFilter)
                finalFilter = B2CFilter.concat(B2BFilter)
              } 
            }
            //console.log(finalFilter)
            setTotLines(B2CFilter.length + B2BFilter.length)
            setTotScrape(B2CFilter.length + B2BFilter.length)
            setTotB2C(B2CFilter.length)
            setTotB2B(B2BFilter.length)
            setProductList(finalFilter)
            setLoadingITC(false)
            setFlagITC(true)
            setLoadedFile('ProductList_EU_20210210_v5.json')
          },
          (error) => {
            console.log(error)
            setLoadingITC(false)
            setLoadedFile('Error Reading! '+error)
          }
        )
    } 
  })

  function scrapeURL(){
    let finalArray = []
    let siteCodeArray = []
    let platformArray = []
    let tmpUrl = ''
    let tmpSiteCode = ''
    let tmpPlatform= ''
    let ficheSummary, ficheNewSummary, ficheNavBar, productShopSku, productDisplayName, productPlatform, productSiteCode
    let tmpJ
    let tmpError
    let dataJ = [
      {
        siteCode : '',
        sitePlatform : '',
        url : '',
        displayName : '',
        sku : '',
        fiche : ''
      }
    ]
    let dataNotFound = [
      {
        siteCode : '',
        sitePlatform : '',
        url : '',
        sku : ''
      }
    ]
    let dataError = [
      {
        siteCode : '',
        sitePlatform : '',
        url : '',
        error : ''
      }
    ]
    setScraping(true)
    setDataFile(dataJ)
    setNotFound(dataNotFound)
    setFailure(dataError)

    if(flagITC){
      console.log(isPlatformFilter)
      console.log(isSiteFilter)
      for (let x = 0; x < isProductList.length; x++){
        tmpUrl = isProductList[x].STANDARD_URL
        tmpPlatform = isProductList[x].B2C_TYPE_CD
        tmpSiteCode = isProductList[x].SITE_CD
        finalArray.push(tmpUrl)
        platformArray.push(tmpPlatform)
        siteCodeArray.push(tmpSiteCode)
      }
    }
    console.log(isTotScrape)
    doScrape(checkProgress)

    function checkProgress() {
      scrapeCounter += 1
      scrapePerc = (scrapeCounter * 100) / isTotScrape
      setSearchStatus(scrapeCounter)
      setProgressBar(scrapePerc)
      if(scrapeCounter === isTotScrape){
        setScraping(false)
        console.log('Scraping Completed!')
      }
    }

    async function doScrape (callback) {
      for(let z = 0; z < isTotScrape; z++){
        let url1 = finalArray[z]
        await rp(url1)
        // eslint-disable-next-line no-loop-func
        .then(html => {
          let $ = cheerio.load(html)
          productShopSku = ""
          productDisplayName = ""
          ficheNavBar = ""
          ficheSummary = ""
          ficheNewSummary = ""
          productPlatform = platformArray[z]
          productSiteCode = siteCodeArray[z]
          if(productPlatform === 'B2C'){
            // Read Navbar Fiche
            // badge-energy-label__badge badge-energy-label__badge badge-energy-label__badge--g new-window
            $(".better-together__fiche a.badge span.badge__grade--with-text span.hidden").each(function(i, element) {
              if (i === 0){ficheNavBar = $(this).prepend().text()}
            })
            // Read Summary Fiche
            $(".pd-buying-tool__cost-box .cost-box .cost-box__badge a.badge span.badge__grade--with-text span.hidden").each(function(i, element) {
              if (i === 0){ficheSummary = $(this).prepend().text()}
            })
            // Read New Summary Fiche
            $(".pd-buying-tool__cost-box .cost-box .cost-box__new-badge .badge-energy-label a.badge-energy-label__badge").each(function(i, element) {
              if (i === 0){ficheNewSummary = $(this).prepend().text()}
            })
            if (ficheNavBar){
              // Read SKU
              $("#apiChangeShopSKU").each(function(i, element) {
                if (i === 0){productShopSku = $(this).prepend().attr('value')}
              })
              // Read Product Name
              $("#apiChangeDisplayName").each(function(i, element) {
                if (i === 0){productDisplayName = $(this).prepend().attr('value')}
              })
              tmpJ = 
              {
                siteCode : productSiteCode,
                sitePlatform : productPlatform,
                url : url1,
                displayName : productDisplayName,
                sku : productShopSku,
                fiche : ficheNavBar
              }

              console.log('B2C SKU: ' + productShopSku + ' - FICHE: ' + ficheNavBar)

              dataJ.push(tmpJ)

              if (ficheNavBar !== ficheSummary){
                if(ficheSummary){
                  tmpJ = 
                  {
                    siteCode : productSiteCode,
                    sitePlatform : productPlatform,
                    url : url1,
                    displayName : productDisplayName,
                    sku : productShopSku,
                    fiche : ficheSummary
                  }
                  dataJ.push(tmpJ)
                } 
              }
              if (ficheNavBar !== ficheNewSummary){
                if(ficheNewSummary){
                  tmpJ = 
                  {
                    siteCode : productSiteCode,
                    sitePlatform : productPlatform,
                    url : url1,
                    displayName : productDisplayName,
                    sku : productShopSku,
                    fiche : ficheSummary
                  }
                  dataJ.push(tmpJ)
                } 
              }

              setDataFile(dataJ)

            } else if(ficheSummary){
              // Read SKU
              $("#apiChangeShopSKU").each(function(i, element) {
                if (i === 0){productShopSku = $(this).prepend().attr('value')}
              })
              // Read Product Name
              $("#apiChangeDisplayName").each(function(i, element) {
                if (i === 0){productDisplayName = $(this).prepend().attr('value')}
              })
              tmpJ = 
              {
                siteCode : productSiteCode,
                sitePlatform : productPlatform,
                url : url1,
                displayName : productDisplayName,
                sku : productShopSku,
                fiche : ficheSummary
              }
              dataJ.push(tmpJ)
              setDataFile(dataJ)
            } else if(ficheNewSummary){
              // Read SKU
              $("#apiChangeShopSKU").each(function(i, element) {
                if (i === 0){productShopSku = $(this).prepend().attr('value')}
              })
              // Read Product Name
              $("#apiChangeDisplayName").each(function(i, element) {
                if (i === 0){productDisplayName = $(this).prepend().attr('value')}
              })
              tmpJ = 
              {
                siteCode : productSiteCode,
                sitePlatform : productPlatform,
                url : url1,
                displayName : productDisplayName,
                sku : productShopSku,
                fiche : ficheNewSummary
              }
              dataJ.push(tmpJ)
              setDataFile(dataJ)
            } else {
              // Read SKU
              $("#apiChangeShopSKU").each(function(i, element) {
                if (i === 0){productShopSku = $(this).prepend().attr('value')}
              })
              tmpJ = 
              {
                siteCode : productSiteCode,
                sitePlatform : productPlatform,
                url : url1,
                sku : productShopSku
              }
              dataNotFound.push(tmpJ)
              setNotFound(dataNotFound)
            }
          } else if (productPlatform === 'B2B'){
            // Read Summary Fiche
            $("#bu-g-product-details_01_0403").each(function(i, element) {
              if (i === 0){ficheSummary = $(this).prepend().text()}
            })
            if(ficheSummary && ficheSummary !== "Zoom out"){
              // Read SKU
              $(".product-details__s-sku").each(function(i, element) {
                if (i === 0){productShopSku = $(this).prepend().text()}
              })
              // Read Product Name
              $(".product-details__title").each(function(i, element) {
                if (i === 0){productDisplayName = $(this).prepend().text()}
              })
              tmpJ = 
              {
                siteCode : productSiteCode,
                sitePlatform : productPlatform,
                url : url1,
                displayName : productDisplayName,
                sku : productShopSku,
                fiche : ficheSummary
              }

              console.log('B2B SKU: '+productShopSku + ' - FICHE: ' + ficheSummary)

              dataJ.push(tmpJ)
              setDataFile(dataJ)
            } else {
              // Read SKU
              $(".product-details__s-sku").each(function(i, element) {
                if (i === 0){productShopSku = $(this).prepend().text()}
              })
              tmpJ = 
              {
                siteCode : productSiteCode,
                sitePlatform : productPlatform,
                url : url1,
                sku : productShopSku
              }
              dataNotFound.push(tmpJ)
              setNotFound(dataNotFound)
            }
          }          
        })
        // eslint-disable-next-line no-loop-func
        .catch(function(err) {
          console.log("Crawl failed for:" + url1)
          tmpError = 
            {
              siteCode : productSiteCode,
              sitePlatform : productPlatform,
              url : url1,
              error : JSON.stringify(err.name + ' ' + err.statusCode)
            }
          dataError.push(tmpError)
          setFailure(dataError)
        })
        .then(callback)
      }  
    }    
  }
  
  async function loadJSON(url){
    return await fetch(url, {
      headers : { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
       }
    })
  }

  return (
    <div>
      <Card>
        <Card.Body>
          <p><b>Step 1 - Load Data</b></p>
          <p></p>
          <p>- Download/Activate <b>Moesif Origin &#38; CORS Changer</b> - <a href="https://chrome.google.com/webstore/detail/moesif-origin-cors-change/digfbfaphojjndkpccljibejjbppifbc" target="_blank" rel="noreferrer">Download</a></p>
          <p>- Add <b>https://www.samsung.com/</b> under <b>Enable extension for only these whitelisted domains</b></p>
        </Card.Body>
      </Card>
      <Card>
        <Card.Body>
          <p><b>Step 2 - Filters</b></p>
          <p></p>
          <div>
            <Form>
              <Form.Group controlId="platformFilter" onChange={(e) => setPlatformFilter(e.target.value)}>
                <Form.Label>Platform: </Form.Label>
                <Form.Control as="select" custom>
                  <option value="B2X">B2C &#38; B2B</option>
                  <option value="B2C">B2C</option>
                  <option value="B2B">B2B</option>
                </Form.Control>
              </Form.Group>
              <Form.Group controlId="siteFilter" onChange={(e) => setSiteFilter(e.target.value)}>
                <Form.Label>Site: </Form.Label>
                <Form.Control as="select" custom>
                  <option value="all">All</option>
                  <option value="al">AL</option>
                  <option value="at">AT</option>
                  <option value="ba">BA</option>
                  <option value="be">BE</option>
                  <option value="be_fr">BE_FR</option>
                  <option value="bg">BG</option>
                  <option value="ch">CH</option>
                  <option value="ch_fr">CH_FR</option>
                  <option value="cz">CZ</option>
                  <option value="de">DE</option>
                  <option value="dk">DK</option>
                  <option value="ee">EE</option>
                  <option value="es">ES</option>
                  <option value="fi">FI</option>
                  <option value="fr">FR</option>
                  <option value="gr">GR</option>
                  <option value="hr">HR</option>
                  <option value="hu">HU</option>
                  <option value="ie">IE</option>
                  <option value="it">IT</option>
                  <option value="lt">LT</option>
                  <option value="lv">LV</option>
                  <option value="mk">MK</option>
                  <option value="nl">NL</option>
                  <option value="no">NO</option>
                  <option value="pl">PL</option>
                  <option value="pt">PT</option>
                  <option value="ro">RO</option>
                  <option value="rs">RS</option>
                  <option value="se">SE</option>
                  <option value="si">SI</option>
                  <option value="rs">RS</option>
                  <option value="uk">UK</option>
                </Form.Control>
              </Form.Group>
            </Form>
          </div>
        </Card.Body>
      </Card>
      <Card>
        <Card.Body>
          <p><b>Step 3 - Load Data</b></p>
          <div>
            <Button variant="primary" disabled={isLoadingITC} onClick={!isLoadingITC ? handleLoadITC : null}>{isLoadingITC ? 'Loading…' : 'Load ITC List'}</Button>
            <Button variant="primary" disabled onClick={loadJSON}>Load Siteimprove List</Button>
          </div>
          <p></p>
          <p>File loaded: <b>{isLoadedFile}</b></p>
          <p>Tot URLs: <b>{isTotLines}</b></p>
          <p>Tot B2C URLs: <b>{isTotB2C}</b></p>
          <p>Tot B2B URLs: <b>{isTotB2B}</b></p>
        </Card.Body>
      </Card>
      <Card>
        <Card.Body>
          <p><b>Step 4 - Scrape Sites</b></p>
          <div>
            <Button variant="primary" disabled={isScraping} onClick={scrapeURL}>{isScraping ? 'Searching…' : 'Search Energy Label'}</Button>
            <p></p>
            <p>Search Status: <b>{isSearchStatus}</b> of <b>{isTotScrape}</b></p>
            <ProgressBar now={isProgressBar} />
          </div>
        </Card.Body>
      </Card>
      <Download fileName={isDataFile} fileNotFound={isNotFound} fileError={isFailed}/>
    </div>
  )
}