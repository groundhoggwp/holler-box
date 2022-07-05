( ($) => {

  const { report_data = [] } = HollerBox
  const {
    icons,
    confirmationModal,
  } = HollerBox.elements

  const { __ } = wp.i18n

  let after, before

  after = moment().subtract(6, 'days')
  before = moment()

  const __YMD = 'YYYY-MM-DD'

  function ApiError (message) {
    this.name = 'ApiError'
    this.message = message
  }

  ApiError.prototype = Error.prototype

  /**
   * Fetch stuff from the API
   * @param route
   * @param params
   * @param opts
   */
  async function apiGet (route, params = {}, opts = {}) {

    let __params = new URLSearchParams()

    Object.keys(params).forEach(k => {
      __params.append(k, params[k])
    })

    const response = await fetch(route + '?' + __params, {
      headers: {
        'X-WP-Nonce': HollerBox.nonces._wprest,
      },
      ...opts,
    })

    let json = await response.json()

    if (!response.ok) {
      console.log(json)
      throw new ApiError(json.message)
    }

    return json
  }

  /**
   * Get all dates between to a before and after
   *
   * @returns {*[]}
   * @param after
   * @param before
   */
  function getDatesInRange (after, before) {
    let date = moment(after)

    const dates = []

    while (date <= before) {
      dates.push(moment(date))
      date.add(1, 'day')
    }

    return dates
  }

  /**
   * There can be only one!
   *
   * @param items
   * @returns {any[]}
   */
  const arrayUnique = (items) => {
    let set = new Set(items)
    return [...set]
  }

  const ReportData = {
    report_data: {},
    popups: {},
    cache: {},

    fetch () {
      return apiGet(HollerBox.routes.report, {
        before: before.format(__YMD),
        after: after.format(__YMD),
      }).then(r => {
        this.report_data = r.data
        this.popups = r.popups
      })
    },

    getPopup (id) {
      return this.popups.find(p => p.ID == id)
    },

    getPopups () {
      return arrayUnique(this.report_data.map(({ popup_id }) => parseInt(popup_id))).
        map(id => this.popups.find(p => p.ID == id))
    },

    getPopupIds () {
      return arrayUnique(this.report_data.map(({ popup_id }) => parseInt(popup_id)))
    },

    getPages () {
      return arrayUnique(this.report_data.map(({ location }) => location))
    },

    sumCount (type, {
      id = false,
      date = false,
      location: _location = false,
    }) {
      return this.report_data.filter(
        ({ popup_id, s_type, s_date, location = '' }) => ( id ? popup_id == id : true )
          && ( date ? s_date === date.format(__YMD) : true )
          && ( _location ? _location === location : true )
          && s_type === type).reduce((total, { s_count }) => total + parseInt(s_count), 0)
    },

    sumConversions (query) {
      return this.sumCount('conversion', query)
    },

    sumImpressions (query) {
      return this.sumCount('impression', query)
    },
  }

  const Table = (selector, {
    headers,
    rows,
    onMount = () => {},
  }) => {

    const $el = $(selector)

    let show = 10

    const renderTable = () => {
      //language=HTML
      return `
          <table>
              <thead>
              ${ headers.map(h => `<th>${ h }</th>`).join('') }
              </thead>
              <tbody>
              ${ rows.slice(0, show).
                      map(row => `<tr>${ row.map(item => `<td>${ item }</td>`).join('') }</tr>`).
                      join('') }
              </tbody>
          </table>`
    }

    $el.html(renderTable())

    onMount()
  }

  const lineChart = (id, {
    query = {},
  }) => {
    const dates = getDatesInRange(after, before)
    const labels = dates.map(m => m.format('MMM D'))
    const data = {
      labels,
      datasets: [
        {
          label: 'impressions',
          data: dates.map(date => ReportData.sumImpressions({ date, ...query })),
          tension: 0.1,
          fill: true,
          backgroundColor: 'rgba(0, 117, 255, 0.20)',
          borderColor: 'rgba(0, 117, 255, 0.25)',
        },
        {
          label: 'conversions',
          data: dates.map(date => ReportData.sumConversions({ date, ...query })),
          tension: 0.1,
          fill: true,
          backgroundColor: 'rgba(0, 117, 255, 0.70)',
          borderColor: 'rgba(0, 117, 255, 0.80)',
        },
      ],
    }
    const config = {
      type: 'line',
      data: data,
      options: {
        maintainAspectRatio: false
      },
    }
    const myChart = new Chart(
      document.getElementById(id),
      config,
    )
  }

  const pages = [
    {
      slug: /popup\/[0-9]+/,
      render: () => {
        // language=HTML
        return `
            <div class="span-full">
                <h1 class="popup-title"></h1>
                <p class="popup-links"><a href="#">&larr; Back</a> | <a href="#" id="edit-popup">${__('Edit')}</a></p>
            </div>
            <div class="holler-panel span-full">
                <div class="holler-panel-header">
                    <h2>All Activity</h2>
                </div>
                <div class="inside">
                    <canvas id="main-graph"></canvas>
                </div>
            </div>
            <div class="holler-panel span-third">
                <div class="holler-panel-header">
                    <h2>Impressions</h2>
                </div>
                <div class="inside">
                    <div class="holler-big-number" id="impressions"></div>
                </div>
            </div>
            <div class="holler-panel span-third">
                <div class="holler-panel-header">
                    <h2>Conversions</h2>
                </div>
                <div class="inside">
                    <div class="holler-big-number" id="conversions"></div>
                </div>
            </div>
            <div class="holler-panel span-third">
                <div class="holler-panel-header">
                    <h2>Conversion Rate</h2>
                </div>
                <div class="inside">
                    <div class="holler-big-number" id="conversion-rate"></div>
                </div>
            </div>
            <div class="holler-panel span-full">
                <div class="holler-panel-header">
                    <h2>Pages</h2>
                </div>
                <div id="pages-table">
                </div>
            </div>
        `
      },
      onMount: ([name, popup_id], setPage) => {

        let popup = ReportData.getPopup(popup_id)

        if ( ! popup ){
          confirmationModal({
            alert: `<p>${__('There is no data for this popup yet. Wait a few days and check again.')}</p>`,
            onConfirm: () => {
              setPage('/')
            }
          })
          return
        }

        $('.popup-title').html(popup.post_title)
        $('#edit-popup').on('click', e => {
          e.preventDefault()

          window.open(`${HollerBox.admin_url}/post.php?post=${popup.ID}&action=edit`, '_self')
        })

        lineChart('main-graph', {
          id: popup.ID,
        })

        let impressions =  ReportData.sumImpressions( { id: popup.ID } )
        let conversions =  ReportData.sumConversions( { id: popup.ID } )

        $('#impressions').html( impressions )
        $('#conversions').html( conversions )
        $('#conversion-rate').html( Math.floor(( conversions / Math.max(impressions, 1) ) * 100) + '%' )

        Table('#pages-table', {
          headers: [
            'Page',
            'Imp.',
            'Conv.',
            'CVR.',
          ],
          rows: ReportData.getPages().map(page => {

            let impressions = ReportData.sumImpressions({ location: page, id: popup.ID })
            let conversions = ReportData.sumConversions({ location: page, id: popup.ID })

            return [
              `<a href="${ page }" target="_blank">${ page }</a>`,
              impressions,
              conversions,
              Math.floor(( conversions / Math.max(impressions, 1) ) * 100) + '%',
            ]
          }).filter(([link, impressions]) => impressions > 0).sort(([la, ia], [lb, ib]) => ib - ia),
        })

      },
    },
    {
      slug: '',
      render: () => {

        // language=HTML
        return `
            <div class="holler-panel span-full">
                <div class="holler-panel-header">
                    <h2>All Activity</h2>
                </div>
                <div class="inside">
                    <canvas id="main-graph"></canvas>
                </div>
            </div>
            <div class="holler-panel span-third">
                <div class="holler-panel-header">
                    <h2>Impressions</h2>
                </div>
                <div class="inside">
                    <div class="holler-big-number" id="impressions"></div>
                </div>
            </div>
            <div class="holler-panel span-third">
                <div class="holler-panel-header">
                    <h2>Conversions</h2>
                </div>
                <div class="inside">
                    <div class="holler-big-number" id="conversions"></div>
                </div>
            </div>
            <div class="holler-panel span-third">
                <div class="holler-panel-header">
                    <h2>Conversion Rate</h2>
                </div>
                <div class="inside">
                    <div class="holler-big-number" id="conversion-rate"></div>
                </div>
            </div>
            <div class="holler-panel span-half">
                <div class="holler-panel-header">
                    <h2>Popups</h2>
                </div>
                <div id="popups-table">
                </div>
            </div>
            <div class="holler-panel span-half">
                <div class="holler-panel-header">
                    <h2>Pages</h2>
                </div>
                <div id="pages-table">
                </div>
            </div>
        `
      },
      onMount: (params, setPage) => {

        lineChart('main-graph', {})

        let impressions =  ReportData.sumImpressions({})
        let conversions =  ReportData.sumConversions({})

        $('#impressions').html( impressions )
        $('#conversions').html( conversions )
        $('#conversion-rate').html( Math.floor(( conversions / Math.max(impressions, 1) ) * 100) + '%' )


        Table('#pages-table', {
          headers: [
            'Page',
            'Imp.',
            'Conv.',
            'CVR.',
          ],
          rows: ReportData.getPages().map(page => {

            let impressions = ReportData.sumImpressions({ location: page })
            let conversions = ReportData.sumConversions({ location: page })

            return [
              `<a href="${ page }" target="_blank">${ page }</a>`,
              impressions,
              conversions,
              Math.floor(( conversions / impressions ) * 100) + '%',
            ]
          }).sort(([la, ia], [lb, ib]) => ib - ia),
        })

        Table('#popups-table', {
          onMount: () => {
            $('.popup-link').on('click', e => {
              e.preventDefault()

              setPage(`/popup/${ e.target.dataset.id }/`)
            })
          },
          headers: [
            'Popup',
            'Imp.',
            'Conv.',
            'CVR.',
          ],
          rows: ReportData.getPopups().map(p => {

            let impressions = ReportData.sumImpressions({ id: p.ID })
            let conversions = ReportData.sumConversions({ id: p.ID })

            return [
              `<a href="#" class="popup-link" data-id="${ p.ID }">${ p.post_title }</a>`,
              impressions,
              conversions,
              Math.floor(( conversions / impressions ) * 100) + '%',
            ]
          }).sort(([la, ia], [lb, ib]) => ib - ia),
        })

      },
    },
  ]

  const Page = {

    slug: '',
    currentPage: pages[0],
    params: [],

    getCurSlug () {
      return window.location.hash.substring(1)
    },

    initFromSlug () {
      this.slug = this.getCurSlug()
      this.params = this.getCurSlug().split('/').filter(p => p)
      this.mount()
    },

    init () {
      if (window.location.hash) {
        this.initFromSlug()
      }
      else {
        history.pushState({}, '', `#/`)
        this.initFromSlug()
      }

      window.addEventListener('popstate', (e) => {
        this.initFromSlug()
      })
    },

    renderReports () {

      // language=HTML
      return `
          <div class="holler-header is-sticky">
              <div id="logo">
                  ${ icons.hollerbox_full }
              </div>
              <div id="holler-datepicker" class="daterange daterange--double"></div>
          </div>
          <div id="reports-here">
              ${ this.currentPage.render() }
          </div>`
    },

    mount () {

      this.currentPage = pages.find(p => this.slug.match(p.slug))

      const setPage = (slug) => {
        history.pushState({}, '', `#${ slug }`)
        this.initFromSlug()
      }

      $('#holler-app').html(this.renderReports())
      const datePicker = new Calendar({
        element: $('#holler-datepicker'),
        presets: [
          {
            label: 'Last 30 days',
            start: moment().subtract(29, 'days'),
            end: moment(),
          },
          {
            label: 'Last 14 days',
            start: moment().subtract(13, 'days'),
            end: moment(),
          },
          {
            label: 'Last 7 days',
            start: moment().subtract(6, 'days'),
            end: moment(),
          },
          {
            label: 'Today',
            start: moment(),
            end: moment(),
          },
          {
            label: 'Yesterday',
            start: moment().subtract(1, 'day'),
            end: moment().subtract(1, 'day'),
          },
          {
            label: 'This month',
            start: moment().startOf('month'),
            end: moment().endOf('month'),
          }, {
            label: 'Last month',
            start: moment().subtract(1, 'month').startOf('month'),
            end: moment().subtract(1, 'month').endOf('month'),
          },
        ],
        format: {
          preset: 'MMM D',
        },
        earliest_date: 'January 1, 2017',
        latest_date: moment(),
        start_date: after,
        end_date: before,
        callback: function () {

          after = this.start_date
          before = this.end_date

          ReportData.fetch().then(() => Page.mount())
        },
      })
      this.currentPage.onMount(this.params, setPage)
    },

  }

  $(() => ReportData.fetch().then(() => Page.init()))

} )(jQuery)
