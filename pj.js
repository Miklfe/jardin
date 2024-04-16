/*!
 * 
 * Version: 2.5 19/07/23
 *
 * Copyright (c) 2019 - 2022 Proxim Jardin ALL RIGHTS RESERVED
 * auteur Mickael FEUVRIER*/
//


$(() => {

  /*html construction*/
  $('<div />').attr('id', 'drawer').appendTo('#planning')
  $('<div />').attr('id', 'toolbar').appendTo('#drawer')
  $('<div />').attr('id', 'context-menu').appendTo('#drawer')
  $('<div />').attr('id', 'scheduler').appendTo('#drawer')
  $('<div />').attr('id', 'loadpanel').appendTo('#planning')

  /*~~~~~~~~~~~~class définition~~~~~~~~~~~~~~~~~~~~~*/
  class modifStore {
    constructor(type, val) {
      this.type = type
      this.value = val
    }
  }

  class equipDefaultSalID {
    constructor(equipeID, salarieID) {
      if (typeof salarieID !== 'undefined') {
        return salarieID
      } else {
        let equipe = $.grep(TEAMS_STORE._array, (e) => {
          return e.id === equipeID
        })
        return equipe[0].defautSalId
      }
    }
  }

  class queryFM {
    constructor(script, param, option) {
      this.script = script
      this.param = param
      this.option = option
    }
  }

  /*~~~~~~~~~~~~~~~~~~~~~déclaration de variable~~~~~~~~~~~~~~~~~~~~~~~é*/
  let appointmentDownloaded = [],
    popupOption = null,
    toastOption = null,
    popupDevisInfo = null,
    popupTimeResult = null,
    popupContacter = null,
    popupSMS = null,
    popupAddClient = null,
    isDrag = true,
    isAdd = true

  const W_HEIGHT = $(window).height(),
    S_IN_H = 3600000

  let cellContextMenuItems = [{
    text: 'Nouveau',
    onItemClick: createAppointment,
    disabled: false
  },
  {
    text: 'Grouper par équipe',
    beginGroup: true,
    onItemClick: groupCell
  },
  {
    text: 'Aller à aujourd\'hui',
    onItemClick: showCurrentDate
  }
  ],
    appointmentContextMenuItems = [{
      text: 'Ouvrir',
      onItemClick: showAppointment
    },
    {
      text: 'Supprimer',
      onItemClick: deleteAppointment
    },
    {
      text: 'Dupliquer',
      onItemClick: duplicateAppointment
    },
    {
      text: 'Statut',
      beginGroup: true,
      items: [{
        text: 'Rendez-vous',
        onItemClick: changeStatut
      },
      {
        text: 'Message',
        onItemClick: changeStatut
      },
      {
        text: 'Non appelé',
        onItemClick: changeStatut
      },
      {
        text: 'Défaut',
        onItemClick: changeStatut
      }
      ]
    },
    {
      text: 'Salarié',
      items: []
    },
    {
      text: 'Détail',
      beginGroup: true,
      onItemClick: createPopupDevisInfo
    },
    {
      text: 'Fiche travaux',
      onItemClick: ficheTrav
    },
    {
      text: 'Contacter',
      onItemClick: contactClient
    },
    {
      text: 'Suivi de chantier',
      beginGroup: true,
      onItemClick: createPopupTimeResult
    }
    ]

  /*~~~~~~~~~~~~~~~~~~~MAGASIN DE DONNEES~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
  /*~~~~~~~~~~~~~~~~~~~INIT DATA~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
  //appel à Filemaker

  getDataAppointmentFM(new Date())
  getDataAnnuelFM(getParamAnnuel(new Date()))
  queryToFM(new queryFM('getDataAppointmentList', '', 0))
  queryToFM(new queryFM('getDataParam', '', 0))
  queryToFM(new queryFM('getDataEquipe', '', 0))
  queryToFM(new queryFM('getDataPonctuel', '', 0))
  queryToFM(new queryFM('getDataOffice', '', 0))
  queryToFM(new queryFM('getDataJourChome', '', 0))
  queryToFM(new queryFM('getDataSalarie', '', 0))
  queryToFM(new queryFM('getDataAbsence', '', 0))
  queryToFM(new queryFM('getListClients', '', 0))


  //Client ref_______________________________________________________
  const CLIENT_STORE = new DevExpress.data.ArrayStore({
    data: [],
    key: 'clt_ref',
  })

  const CLIENT_SOURCE = new DevExpress.data.DataSource({
    store: CLIENT_STORE,
    paginate: true,
    reshapeOnPush: false,
    pageSize: 100
  })

  //appointment_______________________________________________________
  const APPOINTMENT_STORE = new DevExpress.data.ArrayStore({
    data: [],
    key: 'id',
    onInserted: (e) => {
      let val = new modifStore('insert', e)
      appointementChangeFM(val)
    },
    onUpdated: (key, e) => {
      let val = new modifStore('update', e)
      appointementChangeFM(val)
    },
    onRemoved: (key) => {
      let val = new modifStore('remove', key)
      appointementChangeFM(val)
    }
  })

  const APPOINTMENT_SOURCE = new DevExpress.data.DataSource({
    store: APPOINTMENT_STORE,
    paginate: false,
    reshapeOnPush: true
  })

  //appointment list_______________________________________________________
  const APPOINTMENT_LIST_STORE = new DevExpress.data.ArrayStore({
    data: [],
    key: 'id',
  })

  const APPOINTMENT_LIST_SOURCE = new DevExpress.data.DataSource({
    store: APPOINTMENT_LIST_STORE,
    paginate: false,
    reshapeOnPush: true,
  })

  //annuel__________________________________________________________________
  const ANNUEL_STORE = new DevExpress.data.ArrayStore({
    data: [],
    key: 'id',
    onPush: (e) => {
      $('#list1').empty()
      let newliste = ANNUEL_STORE._array
      createList(newliste)
    }
  })

  const ANNUEL_SOURCE = new DevExpress.data.DataSource({
    store: ANNUEL_STORE,
    paginate: false,
    reshapeOnPush: true
  })

  //Data ponctuel_________________________________________________________
  const PONCTUEL_STORE = new DevExpress.data.ArrayStore({
    data: [],
    key: 'id',
    onPush: (e) => {
      $('#list2').empty()
      let newliste = PONCTUEL_STORE._array
      createList(newliste)
    }
  })

  const PONCTUEL_SOURCE = new DevExpress.data.DataSource({
    store: PONCTUEL_STORE,
    paginate: false,
    reshapeOnPush: true
  })

  //office____________________________________________________________________
  const OFFICE_STORE = new DevExpress.data.ArrayStore({
    data: [],
    key: 'id',
    onInserted: (value) => {
      SQL_InsertFM('Office', value);
    },
    onUpdated: (key, value) => {
      delete value.id;
      SQL_UpdateFM('Office', key, value)
    },
    onRemoved: (key) => {
      SQL_removeFM('Office', key)
    },
  })

  const OFFICE_SOURCE = new DevExpress.data.DataSource({
    store: OFFICE_STORE,
    paginate: false,
    reshapeOnPush: true
  })

  //absence____________________________________________________________________
  const ABSENCE_STORE = new DevExpress.data.ArrayStore({
    data: [],
    key: 'id',
    onInserted: (value) => {
      SQL_InsertFM('Absence', value);
    },
    onUpdated: (key, value) => {
      delete value.id;
      SQL_UpdateFM('Absence', key, value)
    },
    onRemoved: (key) => {
      SQL_removeFM('Absence', key)
    },
  })

  const ABSENCE_SOURCE = new DevExpress.data.DataSource({
    store: ABSENCE_STORE,
    paginate: false,
    reshapeOnPush: true
  })

  //jour chomé__________________________________________________________________
  const CHOME_STORE = new DevExpress.data.ArrayStore({
    data: [],
    key: 'id',
    onInserted: (value) => {
      SQL_InsertFM('Chome', value);
    },
    onUpdated: (key, value) => {
      delete value.id;
      SQL_UpdateFM('Chome', key, value)
    },
    onRemoved: (key) => {
      SQL_removeFM('Chome', key)
    }
  })

  //salarie____________________________________________________________________
  const SALARIE_STORE = new DevExpress.data.ArrayStore({
    name: 'salarie',
    data: [],
    key: 'id',
    onInserted: (value) => {
      SQL_InsertFM('Salarie', value);
    },
    onUpdated: (key, value) => {
      SQL_UpdateFM('Salarie', key, value)
    },
    onRemoved: (key) => {
      SQL_removeFM('Salarie', key)
    },
  })

  const SALARIE_SOURCE = new DevExpress.data.DataSource({
    store: SALARIE_STORE,
    paginate: false,
    reshapeOnPush: true
  })

  //equipe____________________________________________________________________
  const TEAMS_STORE = new DevExpress.data.ArrayStore({
    data: [],
    key: 'id',
    onInserted: (value) => {
      SQL_InsertFM('Equipe', value)
    },
    onUpdated: (key, value) => {
      SQL_UpdateFM('Equipe', key, value)
    },
    onRemoved: (key) => {
      SQL_removeFM('Equipe', key)
    },
  })

  //parametre_________________________________________________________________
  const PARAM_STORE = new DevExpress.data.ArrayStore({
    data: [],
    key: 'id',
    onUpdated: (key, value) => {
      SQL_UpdateFM('Parametre', key, value)
    }
  })



  /*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~_______________~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  ==================================|				 			 |=======================================================
  ==================================|		DX WIDGET	 |=======================================================
  ==================================|_______________|=======================================================
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

  /*======================LOCALIZE======================================*/

  DevExpress.localization.locale(navigator.language)
  const FORMAT = DevExpress.localization.formatMessage

  /*=====================SCHEDULER TOOLBAR================================================*/
  const SCHEDULER_TOOLBAR = $('#toolbar').dxToolbar({
    elementAttr: {
      class: 'toolbar_header'
    },
    items: [{
      widget: 'dxButton',
      location: 'before',
      options: {
        icon: 'menu',
        onClick: () => {
          DRAWER.toggle()
          let val = DRAWER.option('opened') === true ? 1 : 0
          PARAM_STORE.update(PARAM_STORE._array[0].id, {
            drawer: val
          })
        },
        elementAttr: {
          class: 'buttonPanel'
        }
      }
    }]
  }).dxToolbar('instance')

  /*=====================DRAWER==========================================*/
  const DRAWER = $('#drawer').dxDrawer({
    opened: false,
    height: W_HEIGHT,
    elementAttr: {
      class: 'drawer-planning'
    },
    width: '100%',
    closeOnOutsideClick: false,
    openedStateMode: 'shrink',
    template: () => {
      let panelAccordionContent = $('<div />').addClass('panel-content-accordion'),
        accordion = $('<div />').width(250).addClass('panel-accordion')
      accordion = accordion.append(panelAccordionContent)
      return accordion
    },
    onOptionChanged: () => {
      let buttonPanel = $('.buttonPanel');
      if (buttonPanel.hasClass('panelOpened')) {
        buttonPanel.removeClass('panelOpened')
      } else {
        buttonPanel.addClass('panelOpened')
      }
    }
  }).dxDrawer('instance')

  /*====================LOADPANEL================================================*/
  const LOADPANEL = $('#loadpanel').dxLoadPanel({
    shadingColor: 'rgba(0,0,0,0.4)',
    position: {
      of: '#drawer'
    },
    height: '100vh',
    width: '100vw',
    visible: false,
    showIndicator: true,
    showPane: true,
    shading: true,
    hideOnOutsideClick: false
  }).dxLoadPanel('instance')

  LOADPANEL.show()

  /*=========================SCHEDULER=======================*/
  const SCHEDULER = $('#scheduler').dxScheduler({
    height: '100vh',
    useDropDownViewSwitcher: true,
    dataSource: APPOINTMENT_SOURCE,
    adaptivityEnabled: false,
    showAllDayPanel: false,
    showCurrentTimeIndicator: false,
    firstDayOfWeek: 1,
    currentView: 'semaine',
    crossScrollingEnabled: false,
    groupByDate: true,
    startDayHour: 8,
    endDayHour: 18.5,
    allowDragging: isDrag,
    groups: ['equipeID'],
    editing: {
      allowDragging: isDrag,
      allowAdding: isAdd
    },
    views: [{
      type: 'workWeek',
      name: 'semaine'
    }],
    resources: [{
      key: 'equipeID',
      fieldExpr: 'equipeID',
      allowMultiple: false,
      dataSource: [getDataTeams([], new Date)],
      label: 'Equipe'
    }, {
      fieldExpr: 'salarieID',
      allowMultiple: true,
      dataSource: SALARIE_STORE,
      label: 'Salarié'
    }, {
      fieldExpr: 'statut',
      label: 'Statut',
      dataSource: [{
        text: 'Rendez-vous'
      },
      {
        text: 'Message'
      },
      {
        text: 'Non appelé'
      },
      {
        text: 'Défaut'
      }
      ],
    }],
    appointmentDragging: {
      group: 'dragging',
      onRemove: (e) => {
        e.component.deleteAppointment(e.itemData);
        createItemElement(e.itemData, $(`#list${e.itemData.devis.typeID}`))
        $(`.sem-${getWeekNumber(SCHEDULER.option('currentDate'))}`).css('display', 'block');
      },
      onAdd: (e) => {
        e.itemData.salarieID = getSalarieHereDefautEquip(new Date(e.itemData.startDate), e.itemData.equipeID)
        e.component.addAppointment(e.itemData)
        e.itemElement.remove()
      },
      onDragMove: (e) => {
        let hoverCell = $('.dx-scheduler-date-table-droppable-cell')
        hoverCell.hasClass('dx-template-chome') ? isDrag = false : isDrag = true
      },
      onDragEnd: (e) => {
        isDrag === false ? e.cancel = true : e.cancel = false
      }
    },
    onAppointmentRendered: () => {
      widthAppointment()
    },
    onAppointmentUpdated: (e) => {
      e.component.repaint()
      e.component.on([{
        'repaint': afterRepaint()
      }])
    },
    onAppointmentUpdating: (e) => {
      if (e.oldData.equipeID != e.newData.equipeID || new Date(e.oldData.startDate).getDay() != new Date(e.newData.startDate).getDay()) {
        e.newData.salarieID = getSalarieHereDefautEquip(new Date(e.newData.startDate), e.newData.equipeID)
      }
    },
    timeCellTemplate: (data, index, element) => {
      element.text(data.text)
        .css({
          color: '#469f11',
          height: cellHeight()
        })
    },
    appointmentTemplate: (e) => {
      let startHour = new Date(e.appointmentData.startDate).toLocaleTimeString(),
        endHour = new Date(e.appointmentData.endDate).toLocaleTimeString(),
        border,
        statut,
        sal = e.appointmentData.salarieID;
      switch (e.appointmentData.statut) {
        case 'Rendez-vous':
          border = 'rdv'
          break
        case 'Message':
          border = 'mes'
          break
        case 'Non appelé':
          border = 'na'
          break
        default:
          border = 'def'
      }
      typeof (e.appointmentData.statut) == 'undefined' ? statut = '' : statut = e.appointmentData.statut
      let wrapper = $('<div />').addClass(['app-content', `${border}`]),
        text = $('<div />').html(`${e.appointmentData.devis.text}`).addClass('app-text'),
        hour = $('<div />').html(`${startHour.slice(0, -3)} - ${endHour.slice(0, -3)}`).addClass('app-hour'),
        stat = $('<div />').html(`${statut}`).addClass('app-statut'),
        icon = $('<div />').addClass('member')
      wrapper.append([text, hour, stat, icon])
      $.each(sal, () => {
        $('<i />').addClass('dx-icon user-icon dx-icon-user').appendTo(icon)
      })
      return wrapper
    },
    dataCellTemplate: (cellData, index, container) => {
      container.css('height', cellHeight())
      let cellTime = cellData.startDate.getTime(),
        cellEquipe = cellData.groups.equipeID
      PARAM_STORE.load().done((data) => {
        for (let [i, value] of data.entries()) {
          const hours = `${cellData.startDate.getHours()}:${cellData.startDate.getMinutes()}:00`
          if (hours >= `${value.pause.from}:00` && hours < `${value.pause.to}:00`) {
            container.addClass('dx-template-Pose');
          }
        }
      })
      OFFICE_STORE.load().done((data) => {
        for (let [i, value] of data.entries()) {
          let officeStart = new Date(data[i].startDate),
            officeEnd
          switch (data[i].periodeID) {
            case 1:
              officeStart = officeStart.getTime() + (8 * S_IN_H)
              officeEnd = officeStart + (4 * S_IN_H)
              break
            case 2:
              officeStart = officeStart.getTime() + (13 * S_IN_H)
              officeEnd = officeStart + (5 * S_IN_H)
              break
            case 3:
              officeStart = officeStart.getTime() + (8 * S_IN_H)
              officeEnd = officeStart + (12 * S_IN_H)
              break
          }
          if (officeStart <= cellTime && officeEnd >= cellTime && cellEquipe == 3) {
            container.addClass('dx-template-Office')
          }
        }
      })
      CHOME_STORE.load().done((data) => {
        for (let [i, value] of data.entries()) {
          let startDate = new Date(data[i].startDate),
            endDate = new Date(data[i].endDate)
          if (startDate.getTime() <= cellTime && endDate.getTime() >= cellTime) {
            container.addClass('dx-template-chome')
          }
        }
      })
    },
    appointmentTooltipTemplate: (e) => {
      let startHour = new Date(e.appointmentData.startDate).toLocaleTimeString(),
        endHour = new Date(e.appointmentData.endDate).toLocaleTimeString(),
        container = $('<div />'),
        contentText = $('<div />').text(e.appointmentData.devis.text).appendTo(container),
        contentHour = $('<div />').text(`${startHour.slice(0, -3)} - ${endHour.slice(0, -3)}`).appendTo(container)
      return container
    },
    onAppointmentFormOpening: (e) => {
      const appStartDate = new Date(e.appointmentData.startDate).getTime();
      const appEndDate = new Date(e.appointmentData.endDate).getTime();
      CHOME_STORE.load().done((data) => {
        for (let [i, value] of data.entries()) {
          let startDate = new Date(data[i].startDate),
            endDate = new Date(data[i].endDate)
          if (startDate.getTime() <= appStartDate && endDate.getTime() >= appEndDate) {
            e.cancel = true
            createToast(ALERT_APPOINTMENT_DISABLE)
          }
        }
      })
      e.form.option({
        labelMode: 'floating',
        colCountByScreen: {
          lg: 1,
          sm: 1
        },
        items: itemsAppointmentForm(e),
      })
    },
    onOptionChanged: (e) => {
      if (e.name === 'currentDate') {
        let currentDate = SCHEDULER.option('currentDate')
        LOADPANEL.option('visible', true)
        popupOption && popupOption._customWrapperClass == 'hoursOffice-popup' ? popupOption.resetOption('contentTemplate') : popupOption
        createOptionTeams()
        SCHEDULER.option('resources[0].dataSource', getDataTeams(PARAM_STORE._array[0].teams, currentDate))
        getDataAppointmentFM(currentDate)
        getDataAnnuelFM(getParamAnnuel(currentDate))
        $('.itemSem').css('display', 'none')
        $(`.sem-${getWeekNumber(currentDate)}`).css('display', 'block')
        $('#button-sem .dx-button-text').text(getWeekNumber(currentDate))
        SCHEDULER.repaint()
        SCHEDULER.on([{
          'repaint': afterRepaint()
        }])
        queryToFM(new queryFM('save_date', SCHEDULER.option('currentDate'), 0))
      }
      if (e.name === 'groupByDate') {
        let currentDate = SCHEDULER.option('currentDate')
        $('#button-sem .dx-button-text').text(getWeekNumber(currentDate))
      }
    },
    onAppointmentContextMenu: (e) => {
      let salarieHere
      if (e.appointmentData.equipeID == 3) {
        salarieHere = getSalarieHere(e.appointmentData.startDate, e.appointmentData.equipeID)
        salarieHere = salarieHere.filter(data => data.id == salOfficer())
      } else {
        salarieHere = getSalarieHere(e.appointmentData.startDate, e.appointmentData.equipeID)
      };
      $.each(salarieHere, (i, item) => {
        let salarieId = salarieHere[i].id
        $.inArray(salarieId, e.appointmentData.salarieID) != -1 ? item.checked = true : item.checked = false
        item.onSelectionChanged = salAppointment
        item.onItemClick = salAppointment
        item.text = salarieHere[i].prenom
      })
      let itemMenuDetail = appointmentContextMenuItems.find((e) => { return e.text === 'Détail' }),
        itemMenuSdc = appointmentContextMenuItems.find((e) => { return e.text === 'Suivi de chantier' }),
        itemMenuFiche = appointmentContextMenuItems.find((e) => { return e.text === 'Fiche travaux' }),
        itemMenuSal = appointmentContextMenuItems.find((e) => { return e.text === 'Salarié' })
      itemMenuSal.items = []
      $.each(salarieHere, (i, data) => {
        itemMenuSal.items.push(data)
      })
      e.appointmentData.devis.dvs_ref ? itemMenuDetail.disabled = false : itemMenuDetail.disabled = true
      e.appointmentData.devis.dvs_ref ? itemMenuFiche.disabled = false : itemMenuFiche.disabled = true
      updateContextMenu(false, appointmentContextMenuItems, getAppointmentMenuTemplate, onItemClick(e), '.dx-scheduler-appointment')
    },
    onCellContextMenu: (e) => {
      if ($(e.cellElement[0]).hasClass('dx-template-chome')) {
        cellContextMenuItems[0].disabled = true;
        updateContextMenu(false, cellContextMenuItems, getCellMenuTemplate, onItemClick(e), '.dx-scheduler-date-table-cell')
      } else {
        cellContextMenuItems[0].disabled = false;
        updateContextMenu(false, cellContextMenuItems, getCellMenuTemplate, onItemClick(e), '.dx-scheduler-date-table-cell')
      }
    },
  }).dxScheduler('instance')

  /*===========================MENU CONTEXTUEL======================================*/
  const CONTEXT_MENU = $('#context-menu').dxContextMenu({
    width: 200,
    dataSource: [],
    disabled: true,
    target: '.dx-scheduler-appointment'
  }).dxContextMenu('instance')

  /*===========================POPUP SEMAINE====================*/
  const POPUP_WEEK = {
    width: 310,
    height: 365,
    title: 'Semaine',
    dragEnabled: false,
    closeOnOutsideClick: true,
    showCloseButton: true,
    wrapperAttr: {
      class: 'sem-popup'
    },
    shading: true,
    shadingColor: '#00000050',
    container: '.dx-viewport',
    contentTemplate: (elem) => {
      const WRAPPER_WEEK_POPUP = $('<div />').addClass('wrapper-popup-week')
      const WRAPPER_YEAR_SELECTER = $('<div/>')
        .appendTo(WRAPPER_WEEK_POPUP)
        .addClass('year-select')
      const YEAR_SELECTER = $('<div />').dxTextBox({
        name: 'select-Year',
        value: new Date(getDate()).getFullYear(),
        width: 200,
        buttons: [{
          location: 'after',
          name: 'prev',
          options: {
            icon: 'chevronright',
            onClick: () => {
              let yearSelecter = YEAR_SELECTER.dxTextBox('instance')
              yearSelecter.option('value', yearSelecter.option('value') + 1)
            }
          }
        },
        {
          location: 'before',
          name: 'next',
          options: {
            icon: 'chevronleft',
            onClick: () => {
              let yearSelecter = YEAR_SELECTER.dxTextBox('instance')
              yearSelecter.option('value', yearSelecter.option('value') - 1)
            }
          }
        }
        ],
      })
      YEAR_SELECTER.appendTo(WRAPPER_YEAR_SELECTER)
      const WRAPPER_TABLE_NUM_WEEK = $('<div />').addClass('wrapper-sem').appendTo(WRAPPER_WEEK_POPUP)
      for (let i = 1; i <= 53; i++) {
        const BUTTON_NUM_WEEK = $('<div />')
          .addClass(`num-sem num-sem${i}`)
          .dxButton({
            stylingMode: 'outlined',
            elementAttr: {
              sem: i
            },
            text: i,
            type: 'normal',
            width: 32,
            height: 32,
            onClick: (e) => {
              let elem = YEAR_SELECTER.dxTextBox('instance')
              goWeek(parseInt(e.element[0].attributes.sem.value), elem.option('value'))
              popupOption.hide()
            }
          })

        WRAPPER_TABLE_NUM_WEEK.append(BUTTON_NUM_WEEK)
      }
      return WRAPPER_WEEK_POPUP
    },
    position: {
      my: 'right top',
      at: 'left top',
      of: '.sem',
      offset: '0 10'
    }
  }

  /*===========================POPUP Heures de Bureau====================*/
  const POPUP_OFFICE_OPTION = {
    width: 260,
    height: 320,
    showTitle: true,
    title: 'heures de bureau',
    showCloseButton: true,
    dragEnabled: false,
    closeOnOutsideClick: true,
    shading: true,
    shadingColor: '#00000050',
    container: '.dx-viewport',
    wrapperAttr: {
      class: 'hoursOffice-popup'
    },
    position: {
      my: 'left center',
      at: 'right center',
      of: '.buttonOffice',
      offset: '10 20'
    },
    contentTemplate: () => {
      const START_DATE = SCHEDULER.getStartViewDate()
      const WRAPPER_POPUP_OFFICE_OPTION = $('<div />').addClass('wrapper-hoursOffice-popup')
      let periodeOffice
      $('.dx-scheduler-header-panel-cell').each((i, elem) => {
        const DAY = new Date(START_DATE)
        DAY.setDate(START_DATE.getDate() + i)
        const NEW_DAY = getDateFormatAAAAMD(DAY)
        OFFICE_SOURCE.filter('startDate', NEW_DAY)
        OFFICE_SOURCE.load().done((result) => {
          result.length != 0 ? periodeOffice = result[0].periodeID : periodeOffice = 0
        })
        const DAY_TEXT = $(elem).children().clone()
        const WRAPPER_DAY = $('<div />').addClass('contener-jourOffice').html(DAY_TEXT)
        const WRAPPER_SELECTOR = $('<div />').addClass(`contener-select select-num-${i}`).data('day', NEW_DAY).dxSelectBox({
          dataSource: [{
            periode: 'Journée',
            periodeID: 3
          }, {
            periode: 'Matin',
            periodeID: 1
          }, {
            periode: 'Après-midi',
            periodeID: 2
          }],
          displayExpr: 'periode',
          valueExpr: 'periodeID',
          value: periodeOffice,
          width: '150px',
          showClearButton: true,
          onValueChanged: (e) => {
            updateHoursOffice(e)
          },
        })
        WRAPPER_DAY.appendTo(WRAPPER_POPUP_OFFICE_OPTION)
        WRAPPER_SELECTOR.appendTo(WRAPPER_POPUP_OFFICE_OPTION)
      })
      return WRAPPER_POPUP_OFFICE_OPTION
    },
    toolbarItems: [{
      visible: false
    }]
  }

  /*===========================POPUP grid personnel abscence====================*/
  const POPUP_SALARIE_ABSENCE_OPTION = {
    width: 610,
    height: 435,
    title: 'Absence des salariés',
    dragEnabled: false,
    closeOnOutsideClick: true,
    showCloseButton: true,
    shading: true,
    shadingColor: '#00000050',
    container: '.dx-viewport',
    wrapperAttr: {
      class: 'grid-salAbsence-popup'
    },
    position: {
      my: 'center',
      at: 'center',
      of: 'window',
    },
    contentTemplate: () => {
      const WRAPPER_SALARIE_ABSENCE = $('<div />').addClass('wrapper-grid-salAbs-popup')
      const GRID_SALARIE_ABSENCE = WRAPPER_SALARIE_ABSENCE.dxDataGrid({
        elementAttr: {
          id: 'grid-salarie-absence'
        },
        dataSource: ABSENCE_STORE,
        scrolling: {
          mode: 'infinite'
        },
        height: '350px',
        showColumnLines: true,
        showBorders: true,
        headerFilter: {
          visible: false
        },
        columns: [{
          dataField: 'salarieID',
          width: 150,
          caption: 'Nom',
          setCellValue: (rowData, value) => {
            rowData.salarieID = value
          },
          lookup: {
            dataSource: SALARIE_STORE,
            valueExpr: 'id',
            displayExpr: 'prenom'
          }
        }, {
          dataField: 'startDate',
          dataType: 'datetime',
          caption: 'Date de début',
          width: 170,
          sortOrder: 'desc'
        }, {
          dataField: 'endDate',
          dataType: 'datetime',
          caption: 'Date de fin',
          width: 170
        }],
        editing: {
          mode: 'form',
          allowUpdating: true,
          allowDeleting: true,
          allowAdding: true
        }
      }).dxDataGrid('instance')
      return WRAPPER_SALARIE_ABSENCE
    },
    toolbarItems: [{
      visible: false
    }]
  }

  /*===========================POPUP ajouter un salarié====================*/
  const POPUP_ADD_SALARIE_OPTION = {
    width: 500,
    height: 350,
    title: 'ajouter un salarié',
    dragEnabled: false,
    closeOnOutsideClick: false,
    showCloseButton: false,
    shading: true,
    shadingColor: '#00000050',
    container: '.dx-viewport',
    wrapperAttr: {
      class: 'addSal-popup'
    },
    position: {
      my: 'center',
      at: 'center',
      of: 'window',
    },
    contentTemplate: () => {
      const WRAPPER_ADD_SALARIE = $('<div />').addClass('wrapper-AddSall-popup')
      const WRAPPER_FORM_ADD_SALARIE = $('<div />').addClass('form-addSal').appendTo(WRAPPER_ADD_SALARIE)
      const WRAPPER_TOOLBAR_ADD_SALARIE = $('<div />').addClass('toolbar-addSal').appendTo(WRAPPER_ADD_SALARIE)
      const FORM_ADD_SALARIE = WRAPPER_FORM_ADD_SALARIE.dxForm({
        readOnly: false,
        showColonAfterLabel: true,
        height: 'auto',
        minColWidth: 300,
        colCount: 2,
        showValidationSummary: false,
        validationGroup: 'formAddSal',
        labelMode: 'floating',
        labelLocation: 'left',
        items: [{
          name: 'nom',
          dataField: 'nom',
          label: {
            text: 'Nom'
          },
          editorOptions: {
            value: '',
            disabled: false
          },
          validationRules: [{
            type: 'required',
            message: 'le nom est requis'
          }]
        }, {
          dataField: 'prenom',
          label: {
            text: 'prénom'
          },
          editorOptions: {
            value: '',
            disabled: false
          },
          validationRules: [{
            type: 'required',
            message: 'le prénom est requis'
          }]
        }, {
          dataField: 'ctr',
          label: {
            text: 'Contrat'
          },
          editorType: 'dxSelectBox',
          colSpan: 2,
          editorOptions: {
            items: ['partage', 'CDD', 'CDI'],
            searchEnabled: true,
            value: '',
            onValueChanged: (data) => {
              if (data.value !== 'CDI') {
                $('.ctr-date').show()
              } else {
                $('.ctr-date').hide();
                FORM_ADD_SALARIE.option('items[3].editorOptions.value', '01/01/2000')
                FORM_ADD_SALARIE.option('items[4].editorOptions.value', '01/01/2100')
              }
            }
          },
          validationRules: [{
            type: 'required',
            message: 'le type de contrat est requis'
          }]
        }, {
          dataField: 'startDate',
          cssClass: 'ctr-date startDate',
          label: {
            text: 'date de début de contrat'
          },
          editorType: 'dxDateBox',
          editorOptions: {
            value: '',
            width: '100%',
          },
          validationRules: [{
            type: 'required',
            message: 'la date de début est requise'
          }]
        }, {
          dataField: 'endDate',
          cssClass: 'ctr-date endDate',
          label: {
            text: 'date de fin de contrat'
          },
          editorType: 'dxDateBox',
          editorOptions: {
            value: '',
            width: '100%',
          },
          validationRules: [{
            type: 'required',
            message: 'la date de fin est requise'
          }]
        }, {
          dataField: 'actif',
          editorType: 'dxCheckBox',
          label: {
            text: 'Actif'
          },
          editorOptions: {
            value: true,
          },
        }]
      }).dxForm('instance')
      const TOOLBAR_ADD_SALARIE = WRAPPER_TOOLBAR_ADD_SALARIE.dxToolbar({
        items: [{
          toolbar: 'bottom',
          widget: 'dxButton',
          location: 'after',
          options: {
            text: 'ok',
            validationGroup: 'formAddSal',
            onClick: function validate(params) {
              let valid = params.validationGroup.validate()
              if (valid.isValid === true) {
                let newData = Object.defineProperty(FORM_ADD_SALARIE._options._optionManager._options.formData, 'id', {
                  value: create_UUID(),
                })
                newData = Object.defineProperty(FORM_ADD_SALARIE._options._optionManager._options.formData, 'actif', {
                  value: 1,
                })
                SALARIE_STORE.insert(
                  newData
                )
                popupOption.hide()
              }
            }
          }
        }, {
          toolbar: 'bottom',
          widget: 'dxButton',
          location: 'after',
          options: {
            text: 'Annuler',
            onClick: () => {
              popupOption.hide()
            }
          }
        }

        ]
      })
      return WRAPPER_ADD_SALARIE
    },
    toolbarItems: [{
      visible: false
    }]
  }

  /*===========================POPUP grid voir les salariés====================*/
  const POPUP_SHOW_SALARIE_OPTION = {
    width: 475,
    height: 520,
    title: 'Salariés',
    dragEnabled: false,
    closeOnOutsideClick: true,
    showCloseButton: true,
    shading: true,
    shadingColor: '#00000050',
    container: '.dx-viewport',
    wrapperAttr: {
      class: 'grid-sal-popup'
    },
    position: {
      my: 'center',
      at: 'center',
      of: 'window',
    },
    contentTemplate: () => {
      const WRAPPER_SHOW_SALARIE = $('<div />').addClass('wrapper-template-popup')
      const WRAPPER_GRID_SHOW_SALARIE = $('<div />').addClass('grid-showSal').appendTo(WRAPPER_SHOW_SALARIE)
      const WRAPPER_TOOLBAR_SHOW_SALARIE = $('<div />').addClass('toolbar-showSal').appendTo(WRAPPER_SHOW_SALARIE)
      const GRID_SHOW_SALARIE = WRAPPER_GRID_SHOW_SALARIE.dxDataGrid({
        elementAttr: {
          id: 'grid-salarie'
        },
        dataSource: SALARIE_STORE,
        filterValue: ['actif', 1],
        scrolling: {
          mode: 'infinite'
        },
        height: '420px',
        showColumnLines: true,
        showBorders: true,
        headerFilter: {
          visible: false
        },
        columns: [{
          dataField: 'nom',
          dataType: 'string',
          width: 130,
          caption: 'Nom',
        }, {
          dataField: 'prenom',
          dataType: 'string',
          width: 130,
          caption: 'Prénom',
        }, {
          dataField: 'ctr',
          dataType: 'string',
          caption: 'Contrat',
          width: 100
        }, {
          dataField: 'actif',
          dataType: 'number',
          caption: 'Actif',
          visible: false
        }],
        editing: {
          mode: 'form',
          allowUpdating: true,
          allowDeleting: true,
          allowAdding: false,
          form: {
            colCount: 1,
            items: [{
              itemType: 'group',
              colCount: 2,
              items: [{
                dataField: 'nom'
              },
              {
                dataField: 'prenom'
              },
              {
                dataField: 'ctr'
              },
              {
                dataField: 'actif',
                editorType: 'dxSwitch',
                editorOptions: {
                  dataType: 'number'
                }
              }]
            }]
          }
        },
        onRowUpdating: (e) => {
          let actif
          e.newData.actif ? actif = 1 : actif = 0
          Object.defineProperty(e.newData, 'actif', {
            value: actif
          })
        },
      }).dxDataGrid('instance')
      const TOOLBAR_SHOW_SALARIE = WRAPPER_TOOLBAR_SHOW_SALARIE.dxToolbar({
        items: [{
          location: 'before',
          widget: 'dxCheckBox',
          options: {
            text: 'Actif',
            value: 1,
            onValueChanged: (e) => {
              e.value === true ? GRID_SHOW_SALARIE.option({
                filterValue: ['actif', 1]
              }) : GRID_SHOW_SALARIE.option({
                filterValue: null
              })
            },
          },
        }]
      })
      return WRAPPER_SHOW_SALARIE
    },
    toolbarItems: [{
      visible: false
    }]
  }

  /*===========================POPUP ajouter une équipe====================*/
  const POPUP_ADD_TEAM_OPTION = {
    width: 500,
    height: 320,
    title: 'ajouter une équipe',
    dragEnabled: false,
    closeOnOutsideClick: false,
    showCloseButton: false,
    wrapperAttr: {
      class: 'addEquipe-popup'
    },
    shading: true,
    shadingColor: '#00000050',
    container: '.dx-viewport',
    position: {
      my: 'center',
      at: 'center',
      of: 'window',
    },
    contentTemplate: () => {
      let salarie
      SALARIE_SOURCE.filter('actif', 1)
      SALARIE_SOURCE.load().done((result) => {
        salarie = result
      })
      const WRAPPER_ADD_TEAM = $('<div />').addClass('wrapper-AddEquipe-popup')
      const WRAPPER_FORM_ADD_TEAM = $('<div />').addClass('form-addSal').appendTo(WRAPPER_ADD_TEAM)
      const WRAPPER_TOOLBAR_ADD_TEAM = $('<div />').addClass('toolbar-addSal').appendTo(WRAPPER_ADD_TEAM)
      const FORM_ADD_TEAM = WRAPPER_FORM_ADD_TEAM.dxForm({
        name: 'FORM_ADD_TEAM',
        readOnly: false,
        showColonAfterLabel: true,
        labelMode: 'floating',
        labelLocation: 'top',
        minColWidth: 300,
        height: 220,
        colCount: 2,
        showValidationSummary: false,
        validationGroup: 'formAddEquip',
        items: [{
          dataField: 'text',
          label: {
            text: 'nom de l\'équipe'
          },
          editorOptions: {
            colSpan: 2,
            value: '',
            disabled: false,
          },
          validationRules: [{
            type: 'required',
            message: 'le nom d\'équipe est requis'
          }]
        }, {
          itemType: 'empty'
        }, {
          dataField: 'startDate',
          label: {
            text: 'date de début'
          },
          editorType: 'dxDateBox',
          editorOptions: {
            value: '',
            width: '100%'
          },
          validationRules: [{
            type: 'required',
            message: 'la date de début est requise'
          }]
        }, {
          dataField: 'endDate',
          label: {
            text: 'date de fin'
          },
          editorType: 'dxDateBox',
          editorOptions: {
            value: '',
            width: '100%'
          },
          validationRules: [{
            type: 'required',
            message: 'la date de fin est requise'
          }]
        }, {
          dataField: 'defautSalId',
          label: {
            text: 'salarié par défaut pour cette équipe'
          },
          editorType: 'dxTagBox',
          editorOptions: {
            dataSource: salarie,
            displayExpr: 'prenom',
            valueExpr: 'id',
            showSelectionControls: true,
            applyValueMode: 'useButtons'
          },
          validationRules: [{
            type: 'required',
            message: 'vous devez selectionner au moin 1 salarié'
          }]
        }, {
          dataField: 'color',
          label: {
            text: 'couleur'
          },
          editorType: 'dxColorBox',
          editorOptions: {
            applyButtonText: 'ok',
          },
          validationRules: [{
            type: 'required',
            message: 'Choisissez une couleur'
          }]
        }]
      }).dxForm('instance')
      const TOOLBAR_ADD_TEAM = WRAPPER_TOOLBAR_ADD_TEAM.dxToolbar({
        items: [{
          toolbar: 'bottom',
          widget: 'dxButton',
          location: 'after',
          options: {
            text: 'ok',
            validationGroup: 'formAddEquip',
            onClick: function validate(params) {
              const VALID = params.validationGroup.validate()
              let newData
              if (VALID.isValid === true) {
                newData = Object.defineProperty(FORM_ADD_TEAM._options._optionManager._options.formData, 'id', {
                  value: create_UUID()
                })
                TEAMS_STORE.insert(
                  newData
                )
                createOptionTeams()
                popupOption.hide()
              }
            }
          }
        }, {
          toolbar: 'bottom',
          widget: 'dxButton',
          location: 'after',
          options: {
            text: 'Annuler',
            onClick: (e) => {
              popupOption.hide()
            }
          }
        }]
      })
      return WRAPPER_ADD_TEAM
    },
    toolbarItems: [{
      visible: false
    }]
  }

  /*===========================POPUP grid voir les équipes====================*/
  const POPUP_SHOW_TEAMS_OPTION = {
    width: 700,
    height: 550,
    title: 'Voir les équipes',
    dragEnabled: false,
    closeOnOutsideClick: true,
    showCloseButton: true,
    wrapperAttr: {
      class: 'grid-salAbsence-popup'
    },
    shading: true,
    shadingColor: '#00000050',
    container: '.dx-viewport',
    position: {
      my: 'center',
      at: 'center',
      of: 'window',
    },
    contentTemplate: () => {
      const WRAPPER_SHOW_TEAMS = $('<div />').addClass('wrapper-grid-showEquip-popup')
      const GRID_SHOW_TEAMS = WRAPPER_SHOW_TEAMS.dxDataGrid({
        dataSource: TEAMS_STORE,
        height: '460px',
        showColumnLines: true,
        showBorders: true,
        headerFilter: {
          visible: false
        },
        editing: {
          mode: 'form',
          allowUpdating: true,
          allowDeleting: true,
          allowAdding: false
        },
        onRowRemoved: (team) => {
          let array = PARAM_STORE._array[0].teams
          array = array.filter(e => e !== team.key)
          PARAM_STORE.update(PARAM_STORE._array[0].id, {
            teams: array
          })
        },
        columns: [{
          dataField: 'text',
          width: 110,
          caption: 'Nom',
        }, {
          dataField: 'startDate',
          dataType: 'datetime',
          caption: 'Date de début',
          width: 110,
          sortOrder: 'desc'
        }, {
          dataField: 'endDate',
          dataType: 'datetime',
          caption: 'Date de fin',
          width: 110
        }, {
          dataField: 'defautSalId',
          width: 150,
          caption: 'Salariés par défaut',
          lookup: {
            dataSource: SALARIE_STORE,
            valueExpr: 'id',
            displayExpr: 'prenom'
          },
          cellTemplate: (container, options) => {
            const NO_BREAK_SPACE = '\u00A0'
            const TEXT = (options.value || []).map(element => options.column.lookup.calculateCellValue(element)).join(', ')
            container.text(TEXT || NO_BREAK_SPACE).attr('title', TEXT)
          },
          editCellTemplate: tagBoxEquipeDefautSalId,
        }, {
          dataField: 'color',
          width: 100,
          caption: 'Couleur',
          lookup: {
            dataSource: SALARIE_STORE,
            valueExpr: 'id',
            displayExpr: 'prenom'
          },
          cellTemplate: (container, options) => {
            const COLOR = $('<div />').css('backgroundColor', options.value).addClass('color-equipe')
            container.append(COLOR)
          },
          editCellTemplate: colorPickerEquipe,
        }],
      }).dxDataGrid('instance')
      return WRAPPER_SHOW_TEAMS
    },
    toolbarItems: [{
      visible: false
    }]
  }

  /*===========================POPUP grid jours Chomés====================*/
  const POPUP_GRID_UNWORKINGDAY_OPTION = {
    width: 455,
    height: 480,
    title: 'Jours chomés',
    dragEnabled: false,
    closeOnOutsideClick: true,
    showCloseButton: true,
    wrapperAttr: {
      class: 'grid-unworkedDay-popup'
    },
    shading: true,
    shadingColor: '#00000050',
    container: '.dx-viewport',
    position: {
      my: 'center',
      at: 'center',
      of: 'window',
    },
    contentTemplate: () => {
      const WRAPPER_GRID_UNWORKINGDAY = $('<div />').addClass('wrapper-grid-salAbs-popup')
      const GRID_UNWORKINGDAY = WRAPPER_GRID_UNWORKINGDAY.dxDataGrid({
        dataSource: CHOME_STORE,
        scrolling: {
          mode: 'infinite'
        },
        height: '400px',
        showColumnLines: true,
        showBorders: true,
        headerFilter: {
          visible: true
        },
        columns: [{
          dataField: 'startDate',
          dataType: 'date',
          caption: 'Date de début',
          width: 170,
          sortOrder: 'desc'
        }, {
          dataField: 'endDate',
          dataType: 'date',
          caption: 'Date de fin',
          width: 170
        }],
        editing: {
          mode: 'form',
          allowUpdating: true,
          allowDeleting: true,
          allowAdding: true
        },
        onRowUpdated: () => {
          SCHEDULER.repaint()
          SCHEDULER.on([{
            'repaint': afterRepaint()
          }])
        },
        onRowInserted: () => {
          SCHEDULER.repaint()
          SCHEDULER.on([{
            'repaint': afterRepaint()
          }])
        },
        onRowRemoved: () => {
          SCHEDULER.repaint()
          SCHEDULER.on([{
            'repaint': afterRepaint()
          }])
        }
      })
      return WRAPPER_GRID_UNWORKINGDAY
    },
    toolbarItems: [{
      visible: false
    }]
  }
  /*===========================POPUP grid jours Chomés====================*/
  const POPUP_SEARCH = {
    width: 455,
    height: 480,
    title: 'Recherche',
    dragEnabled: false,
    closeOnOutsideClick: true,
    showCloseButton: true,
    wrapperAttr: {
      class: 'grid-search-popup'
    },
    shading: true,
    shadingColor: '#00000050',
    container: '.dx-viewport',
    position: {
      my: 'center',
      at: 'center',
      of: 'window',
    },
    contentTemplate: () => {
      const WRAPPER_LIST_SEARCH = $('<div />').addClass('wrapper-grid-search-popup')
      const LIST_SEARCH = WRAPPER_LIST_SEARCH.dxList({
        dataSource: APPOINTMENT_LIST_STORE,
        scrolling: {
          mode: 'infinite'
        },
        height: '400px',
        itemTemplate: function (data, _, element) {
          element.append(
            $("<b>").text(data.nom), $("<br />"),
            $("<p>").text(data.devis).css("margin", 0),
            $("<p>").text(data.date).css("margin", 0)
          )
        },
        searchEnabled: true,
        searchExpr: ['nom', 'devis'],
        searchMode: 'contains',
        pageLoadMode: 'scrollBottom',
        onItemClick(e) {
          const DAY = getDateFormatDDMMAAAA_AAAAMD(e.itemData.date)
          SCHEDULER.option('currentDate', new Date(DAY))
          popupOption.hide()
        },
      })
      return WRAPPER_LIST_SEARCH
    },
    toolbarItems: [{
      visible: false
    }]
  }

  /*=====================ACCORDION==============================================*/
  const ACCORDION = $('.panel-content-accordion').dxAccordion({
    dataSource: [{
      title: 'Options',
      id: 3
    }, {
      title: 'Ponctuel',
      id: 2,
    }, {
      title: 'Annuel',
      id: 1,
    }],
    animationDuration: 300,
    collapsible: true,
    multiple: false,
    width: 250,
    height: 'auto',
    deferRendering: false,
    itemTitleTemplate: (itemData, itemIndex, itemElement) => {
      const TITLE = $('<span />').text(itemData.title)
      TITLE.appendTo(itemElement)
    },
    itemTemplate: (itemData, itemIndex, itemElement) => {
      let height_wrapper = (W_HEIGHT - 150) > 750 ? 750 : W_HEIGHT - 150
      const WRAPPER_LISTE = $('<div />').addClass('listContent').height(height_wrapper)
      const WRAPPER_DRAGGABLE_ITEMS = $('<div />').addClass('list scroll').attr('id', `list${itemData.id}`);
      WRAPPER_LISTE.append(WRAPPER_DRAGGABLE_ITEMS)
      itemElement.append(WRAPPER_LISTE);
      switch (itemIndex) {
        case 1:
          PONCTUEL_SOURCE.load().done((result) => {
            createList(result)
          })
          break
        case 2:
          let d = SCHEDULER.option('currentDate')
          d = d.getFullYear()
          ANNUEL_SOURCE.load().done((result) => {
            createList(result)
          })
          break
        default:
          const OPTION_SEARCH = $('<div />').addClass('option search-option')
          $('#list3').append(OPTION_SEARCH)
          $('#list3').append($('<div />').addClass('option groupChanged'))
          createOptionGroupByDate()
          const TEAMS_SWITCH = $('<div />').addClass('option equipChanged')
          $('#list3').append(TEAMS_SWITCH)
          TEAMS_SWITCH.append($('<span />').addClass('option-label').text('afficher les équipes...'))
          TEAMS_SWITCH.append($('<div />').addClass('switchEquip group-option').attr('id', 'switch-teams'))
          const OPTION_OFFICE = $('<div />').addClass('option groupe-option')
          OPTION_OFFICE.append($('<span />').addClass('option-label').text('Bureau'))
          $('#list3').append(OPTION_OFFICE)
          const OPTION_SALARIE = $('<div />').addClass('option groupe-option')
          OPTION_SALARIE.append($('<span />').addClass('option-label').text('Salariés'))
          $('#list3').append(OPTION_SALARIE)
          const OPTION_TEAMS = $('<div />').addClass('option groupe-option')
          OPTION_TEAMS.append($('<span />').addClass('option-label').text('Equipe'))
          $('#list3').append(OPTION_TEAMS)
          let OPTION_UNWORKING_DAY = $('<div />').addClass('option groupe-option')
          OPTION_UNWORKING_DAY.append($('<span />').addClass('option-label').text('Jour non travaillé'))
          $('#list3').append(OPTION_UNWORKING_DAY)
          const OPTION_ACTION = $('<div />').addClass('option groupe-option action')
          OPTION_ACTION.append($('<span />').addClass('option-label').text('Actions'))
          $('#list3').append(OPTION_ACTION)
          const BUTTON_OPTION = [
            {
              group: OPTION_SEARCH,
              text: 'Rechercher',
              icon: 'search',
              className: 'buttonSearch',
              event: {
                intern: {
                  name: createPopupOption,
                  param: {
                    contentOption: POPUP_SEARCH
                  }
                }
              }
            }, {
              group: OPTION_OFFICE,
              text: 'Gerer les heures de Bureau',
              icon: 'ja-office',
              className: 'buttonOffice',
              event: {
                intern: {
                  name: createPopupOption,
                  param: {
                    contentOption: POPUP_OFFICE_OPTION
                  }
                }
              }
            }, {
              group: OPTION_SALARIE,
              text: 'Gérer les abscences',
              icon: 'ja-abs',
              className: 'buttonAbsence',
              event: {
                intern: {
                  name: createPopupOption,
                  param: {
                    contentOption: POPUP_SALARIE_ABSENCE_OPTION
                  }
                }
              }
            }, {
              group: OPTION_SALARIE,
              text: 'Ajouter un salarié',
              icon: 'ja-add-sal',
              className: 'buttonAddSalarie',
              event: {
                intern: {
                  name: createPopupOption,
                  param: {
                    contentOption: POPUP_ADD_SALARIE_OPTION
                  }
                }
              }
            }, {
              group: OPTION_SALARIE,
              text: 'Voir les salariés',
              icon: 'ja-show-sal',
              className: 'buttonShowSalarie',
              event: {
                intern: {
                  name: createPopupOption,
                  param: {
                    contentOption: POPUP_SHOW_SALARIE_OPTION
                  }
                }
              }
            }, {
              group: OPTION_TEAMS,
              text: 'Ajouter une équipe',
              icon: 'ja-add-team',
              className: 'buttonShowEquipe',
              event: {
                intern: {
                  name: createPopupOption,
                  param: {
                    contentOption: POPUP_ADD_TEAM_OPTION
                  }
                }
              }
            }, {
              group: OPTION_TEAMS,
              text: 'Voir les équipes',
              icon: 'ja-show-team',
              className: 'buttonShowEquipe',
              event: {
                intern: {
                  name: createPopupOption,
                  param: {
                    contentOption: POPUP_SHOW_TEAMS_OPTION
                  }
                }
              }
            }, {
              group: OPTION_UNWORKING_DAY,
              text: 'Jour non travaillé',
              icon: 'ja-calendar',
              className: 'buttonUnworkedDay',
              event: {
                intern: {
                  name: createPopupOption,
                  param: {
                    contentOption: POPUP_GRID_UNWORKINGDAY_OPTION
                  }
                }
              }
            }, {
              group: OPTION_ACTION,
              text: 'Actualiser',
              icon: 'ja-reload',
              event: {
                fmScript: {
                  name: 'Actualiser',
                  param: getDate
                }
              }
            }, {
              group: OPTION_ACTION,
              text: 'Fiche travaux',
              icon: 'ja-export',
              event: {
                fmScript: {
                  name: 'Creation_fiche_chantier',
                  param: ficheTravSemaine
                }
              }
            }, {
              group: OPTION_ACTION,
              text: 'Reconnexion',
              icon: 'ja-admin',
              event: {
                fmScript: {
                  name: 'Reconnexion'
                }
              }
            }]
          $.each(BUTTON_OPTION, function (key, value) {
            createButtonOption(value)
          })
      }
    },
  }).dxAccordion('instance')


  /*===========================scroll sur list====================*/

  const SCROLL_VIEW_LISTE = $('.listContent').dxScrollView({
    useNative: false,
    showScrollbar: 'onScroll',
  }).dxScrollView('instance')

  /*================================Notification================================*/
  const ALERT_TEAM = {
    message: 'vous devez sélectionner au moin une équipe',
    type: 'error'
  }

  const ALERT_APPOINTMENT_DISABLE = {
    message: 'vous ne pouvez pas créer d\'évenement pour cette date.',
    type: 'warning'
  }

  const ALERT_SMS_SUCCESS = {
    message: 'le SMS a bien été envoyé',
    type: 'success'
  }

  function start() {
    intervalId = setInterval(() => {
      queryToFM(new queryFM('getNotification', "", 1))
    }
      , 5000)
  }

  setNotification = (val) => {
    const VAL = JSON.parse(val)
    createToast({
      message: VAL.data,
      type: 'success',
      position: { at: 'right top', offset: '-200 50' },
      displayTime: 5000,
      width: 'auto',
      animation: {
        show: { type: 'fade', duration: 400, from: 0, to: 1 },
        hide: { type: 'fade', duration: 400, from: 1, to: 0 }
      },
    })
  }

  //start()


  /*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~__________________~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  ==================================|				        	 |===================================================
  ==================================|	   	FONCTION	   |===================================================
  ==================================|__________________|===================================================
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
  /*fonction appeler par Filmaker pour charger les data______________________________*/
  majListAnnuel = (val) => {
    if (val == getWeekNumber(SCHEDULER.option('currentDate'))) {
      getDataAnnuelFM(getParamAnnuel(SCHEDULER.option('currentDate')))
    }
  }

  setData = (val) => {
    const VAL = JSON.parse(val)
    const EXPR = VAL.store
    const DATA_STORE = [{
      store: SALARIE_STORE,
      event: {
        name: 'salarie'
      }
    }, {
      store: TEAMS_STORE,
      event: {
        name: 'teams',
        callback: afterTeamsInStore
      }
    }, {
      store: CHOME_STORE,
      event: {
        name: 'chome',
      }
    }, {
      store: ABSENCE_STORE,
      event: {
        name: 'absence',
      }
    }, {
      store: OFFICE_STORE,
      event: {
        name: 'office',
      }
    }, {
      store: PARAM_STORE,
      event: {
        name: 'param',
      }
    }, {
      store: APPOINTMENT_STORE,
      event: {
        name: 'appointment',
      }
    }, {
      store: APPOINTMENT_LIST_STORE,
      event: {
        name: 'appointment_list',
      }
    }, {
      store: PONCTUEL_STORE,
      event: {
        name: 'ponctuel',
      }
    }, {
      store: ANNUEL_STORE,
      event: {
        name: 'annuel',
      }
    }, {
      store: CLIENT_STORE,
      event: {
        name: 'client',
        callback: afterListClientInStore
      }
    }]
    let arr = $.grep(DATA_STORE, function (n, i) {
      let result = n.event.name == EXPR
      return (result);
    });
    let store = arr[0].store
    if (store == ANNUEL_STORE || store == PONCTUEL_STORE) {
      store.clear()
    }
    const DATA = VAL.data
    DATA.forEach((e, i) => {
      store.push([{
        type: 'insert',
        data: e,
        index: i
      }])
    })
    let func = arr[0].event.callback
    func()
  }

  function afterListClientInStore() {
    SCHEDULER.repaint()
    SCHEDULER.on([{
      'initialized': afterRepaint()
    }])
  }

  /*exécuté après chargement des data équipe*/
  function afterTeamsInStore() {
    createOptionTeams()
    SCHEDULER.option(
      'resources[0].dataSource',
      getDataTeams(
        PARAM_STORE._array[0].teams,
        SCHEDULER.option('currentDate')
      )
    )
  }

  /*initialiser les parametres*/
  function initParam() {
    PARAM_STORE._array[0].drawer == 1 ? DRAWER.option('opened', true) : false
    if (PARAM_STORE._array[0].currentDate.length != 0) {
      SCHEDULER.option('currentDate', new Date(PARAM_STORE._array[0].currentDate))
      PARAM_STORE.update(PARAM_STORE._array[0].id, {
        currentDate: ''
      })
    }
  }

  /*définir le salarié de bureau*/
  function salOfficer() {
    let office
    SALARIE_STORE.load().done((e) => {
      const CHEF = e.filter(sal => sal.bureau == 1)
      CHEF.length === 0 ? office = '' : office = CHEF[0].id
    })
    return office
  }

  /*relatif aux <scheduler>________________________________________________________________________*/

  /*recalcul de la largeur des appointments dans le scheduler*/
  function widthAppointment() {
    const WIDTH_CELL = $('.dx-scheduler-date-table-cell').width()
    $('.dx-scheduler-appointment-vertical').width(WIDTH_CELL + 1.6)
  }

  /*responsive height*/
  function cellHeight() {
    const HEIGHT_CELL = ((W_HEIGHT - (50 + 36 + 30)) / 21) - 1;
    return HEIGHT_CELL
  }

  /*mise en place des éléments après repaint du SCHEDULER*/
  function afterRepaint() {
    $('.dx-scheduler-view-switcher').remove()
    $('.dx-scheduler-view-switcher-label').remove()
    createSemContainer()
    initWeekNumber()
    initParam()
    LOADPANEL.hide()
  }

  /*contenu du formulaire des appointment*/
  function itemsAppointmentForm(e) {
    const ITEMS_APPOINTMENT_FORM = [{
      itemType: 'group',
      name: 'title',
      colCount: 3,
      items: []
    },
    {
      itemType: 'group',
      name: 'date',
      colCount: 2,
      items: [{
        dataField: 'startDate',
        label: {
          text: 'Date de début',
          visible: false
        },
        editorType: 'dxDateBox',
        editorOptions: {
          placeholder: 'date de début',
          width: '100%',
          type: 'datetime',
          disabledDates: (args) => {
            const CHOME = disableDate(args)
            const RESULT = args.view === 'month' ? CHOME.weekend || CHOME.chome : false
            return RESULT
          },
          onValueChanged: (date) => {
            e.form.updateData('endDate', dateFinActualise(date.value, e));
          }
        }
      }, {
        name: 'endDate',
        dataField: 'endDate',
        label: {
          text: 'Date de fin',
          visible: false
        },
        editorType: 'dxDateBox',
        editorOptions: {
          placeholder: 'date de fin',
          width: '100%',
          type: 'datetime',
          disabledDates: (args) => {
            const CHOME = disableDate(args)
            const RESULT = args.view === 'month' ? CHOME.weekend || CHOME.chome : false
            return RESULT
          }
        }
      }]
    },
    {
      itemType: 'group',
      name: 'description',
      colCount: 1,
      items: [{
        name: 'description',
        dataField: 'devis.description',
        label: {
          text: 'Description',
          visible: false
        },
        colSpan: 1,
        editorType: 'dxTextArea',
        editorOptions: {
          displayExpr: 'text',
          elementAttr: {
            id: 'description'
          }
        }
      }, {
        name: 'observation',
        dataField: 'observation',
        label: {
          text: 'Observation',
          visible: false
        },
        colSpan: 1,
        editorType: 'dxTextArea',
        editorOptions: {
          displayExpr: 'text',
          elementAttr: {
            id: 'observation'
          }
        }
      }, {
        name: 'clt_ref',
        dataField: 'devis.client.clt_ref',
        label: {
          text: 'clt_ref',
          visible: false
        },
        colSpan: 2,
        editorType: 'dxTextArea',
        editorOptions: {
          displayExpr: 'text',
          elementAttr: {
            id: 'clt_ref'
          },
          visible: false
        }
      }]
    },
    {
      itemType: 'group',
      cssClass: 'group-col-gap',
      name: 'information',
      colCount: 3,
      items: [{
        name: 'statut',
        dataField: 'statut',
        label: {
          visible: false
        },
        editorType: 'dxSelectBox',
        editorOptions: {
          visible: e.component._editAppointmentData === undefined || (e.component._editAppointmentData !== undefined & e.appointmentData.devis !== undefined & e.appointmentData.devis.detail === undefined) ? false : true,
          placeholder: 'Statut',
          dataSource: [{
            text: 'Rendez-vous'
          },
          {
            text: 'Message'
          },
          {
            text: 'Non appelé'
          },
          {
            text: 'Défaut'
          }
          ],
          width: '100%',
          itemTemplate: (itemData) => {
            return itemData.text
          },
          displayExpr: 'text',
          value: typeof e.appointmentData.statut !== 'undefined' ? e.appointmentData.statut : 'Défaut',
          valueExpr: 'text',
          onOpened: (e) => {
            e.component._popup.option('width', 180)
          }
        }
      }, {
        name: 'equipe',
        dataField: 'equipeID',
        label: {
          text: 'Equipe',
          visible: false
        },
        editorType: 'dxSelectBox',
        editorOptions: {
          visible: e.component._editAppointmentData === undefined || (e.component._editAppointmentData !== undefined & e.appointmentData.devis !== undefined & e.appointmentData.devis.detail === undefined) ? false : true,
          width: '100%',
          placeholder: 'Equipe',
          dataSource: TEAMS_STORE,
          displayExpr: 'text',
          valueExpr: 'id',
        }
      }, {
        name: 'salarie',
        dataField: 'salarieID',
        label: {
          text: 'Salariés',
          visible: false
        },
        editorType: 'dxTagBox',
        editorOptions: {
          visible: e.component._editAppointmentData === undefined || (e.component._editAppointmentData !== undefined & e.appointmentData.devis !== undefined & e.appointmentData.devis.detail === undefined) ? false : true,
          placeholder: 'Salariés',
          width: '100%',
          dataSource: getSalarieHere(e.appointmentData.startDate, e.appointmentData.equipeID),
          value: new equipDefaultSalID(e.appointmentData.equipeID, e.appointmentData.salarieID),
          displayExpr: 'prenom',
          valueExpr: 'id',
          showSelectionControls: true,
          onOpened: (e) => {
            e.component._popup.option('width', 230)
          }
        }
      }]
    }
    ]
    if (e.component._editAppointmentData !== undefined) {
      let title = {
        name: 'Titre_dvs',
        dataField: 'devis.text',
        label: {
          text: 'Titre',
          visible: false
        },
        colSpan: 3,
        editorType: 'dxTextBox',
        editorOptions: {
          disabled: true,
          displayExpr: 'text',
          elementAttr: {
            id: 'nom_dvs'
          },
          visible: true,
        }
      }
      ITEMS_APPOINTMENT_FORM[0].items.push(title)
    } else {
      let title = {
        name: 'titre_select',
        dataField: 'devis.text',
        label: {
          text: 'Titre',
          visible: false,
        },
        colSpan: 2,
        editorType: 'dxSelectBox',
        editorOptions: {
          dataSource: CLIENT_SOURCE,
          valueExpr: 'clt_nom',
          displayExpr: 'clt_nom',
          itemTemplate: function (itemData, itemIndex, itemElement) {
            return $("<div />").append(
              $("<div />").text(`${itemData.clt_nom}`).css({ "display": "inline-block", "min-width": "50%", "margin-right": "15px" }),
              $("<div />").text(`${itemData.clt_ville}`).css({ "display": "inline-block", "text-align": "left" })
            );
          },
          elementAttr: {
            id: 'nom'
          },
          width: '100%',
          type: 'text',
          searchEnabled: true,
          searchMode: 'startswith',
          minSearchLength: 1,
          acceptCustomValue: true,
          visible: true,
          onItemClick: (data) => {
            if (data.itemData) {
              getDataClient(data.itemData.clt_ref)
              setDataClient = (val) => {
                console.log(e.form.option())
                textClt = `${JSON.parse(val).adres}\n${JSON.parse(val).ville}\n${JSON.parse(val).tel1}\n${JSON.parse(val).tel2}`
                e.form.option('items[2].items[0].editorOptions.value', textClt)
                e.form.option('items[2].items[2].editorOptions.value', data.itemData.clt_ref)
              }
            }
          },
          onCustomItemCreating: (data) => {
            if (!data.text || $('.dx-dialog').length) {
              data.customItem = null
              return
            }
            const cltRefs = CLIENT_STORE._array.map((item) => item.clt_ref)
            const ref = Math.max.apply(null, cltRefs) + 1
            const newItem = {
              clt_nom: data.text,
              clt_ref: ref,
            };
            data.customItem = CLIENT_SOURCE.store().insert(newItem)
              .then(() => msgCreateClient(newItem, e))
              .then(() => CLIENT_SOURCE.load())
              .then(() => newItem)
              .catch((error) => {
                throw error;
              })
          }
        },
        validationRules: [{
          type: 'required',
          message: 'le titre est requis'
        }]
      }
      let buttonNewClient = {
        name: 'button_nouveau_client',
        label: {
          visible: false
        },
        editorType: 'dxButton',
        editorOptions: {
          width: '100%',
          text: 'nouveau client',
          type: 'success',
          elementAttr: {
            class: 'button-nouveau-client'
          },
          visible: true,
          onClick: () => {
            const cltRefs = CLIENT_STORE._array.map((item) => item.clt_ref)
            const ref = Math.max.apply(null, cltRefs) + 1
            const newItem = {
              clt_nom: '',
              clt_ref: ref,
            }
            CLIENT_SOURCE.store().insert(newItem)
            CLIENT_SOURCE.load()
            msgCreateClient(newItem, e)
          }
        }
      }
      ITEMS_APPOINTMENT_FORM[0].items.push(title)
      ITEMS_APPOINTMENT_FORM[0].items.push(buttonNewClient)
      e.form.option('formData.statut', 'Rendez-vous')
    }
    if (e.component._editAppointmentData !== undefined) {
      let groupButtonAction = {
        itemType: 'group',
        name: 'button_action',
        cssClass: 'group-col-gap',
        colCount: 3,
        items: [{
          name: 'button_contact',
          label: {
            visible: false
          },
          editorType: 'dxButton',
          editorOptions: {
            width: '100%',
            text: 'contacter',
            type: 'success',
            elementAttr: {
              class: 'button-contact'
            },
            onClick: () => {
              contactClient(e)
            }
          }
        }]
      }
      ITEMS_APPOINTMENT_FORM.push(groupButtonAction)
      if (e.appointmentData.devis === undefined || e.appointmentData.devis.detail === undefined) {
        let button_map = {
          name: 'button_map',
          label: {
            visible: false
          },
          editorType: 'dxButton',
          editorOptions: {
            width: '100%',
            text: 'map',
            type: 'success',
            elementAttr: {
              class: 'button-map'
            },
            visible: true,
            onClick: () => {
              queryToFM(new queryFM('map adresse', e.appointmentData.devis.client.clt_ref, 0))
            }
          }
        }
        ITEMS_APPOINTMENT_FORM[4].items.push(button_map)
      }
      if (e.appointmentData.devis !== undefined && e.appointmentData.devis.detail !== undefined) {
        let button_detail = {
          name: 'button_detail',
          label: {
            visible: false
          },
          editorType: 'dxButton',
          editorOptions: {
            width: '100%',
            text: 'détail',
            type: 'success',
            elementAttr: {
              class: 'button-detail'
            },
            visible: true,
            onClick: () => {
              createPopupDevisInfo(e)
            }
          }
        }
        ITEMS_APPOINTMENT_FORM[4].items.push(button_detail)
        let button_ficheTrav = {
          name: 'button_ficheTrav',
          label: {
            visible: false
          },
          editorType: 'dxButton',
          editorOptions: {
            width: '100%',
            text: 'fiche travaux',
            type: 'success',
            elementAttr: {
              class: 'button-fiche-trav'
            },
            visible: true,
            onClick: () => {
              ficheTrav(e)
            }
          }
        }
        ITEMS_APPOINTMENT_FORM[4].items.push(button_ficheTrav)
        let button_suiviChantier = {
          name: 'button_suiviChantier',
          label: {
            visible: false
          },
          editorType: 'dxButton',
          editorOptions: {
            width: '100%',
            text: 'suivi de chantier',
            type: 'success',
            elementAttr: {
              class: 'button-fiche-trav'
            },
            visible: true,
            onClick: () => {
              createPopupTimeResult(e)
            }
          }
        }
        ITEMS_APPOINTMENT_FORM[4].items.push(button_suiviChantier)

      }
    }
    return ITEMS_APPOINTMENT_FORM
  }

  /*salarié présent (absent ou bureau)*/
  function getSalarieHere(j, teamID) {
    let salariePresent,
      absenceData,
      officeData
    SALARIE_SOURCE.filter('actif', 1)
    SALARIE_SOURCE.load().done((result) => {
      salariePresent = result
    })
    ABSENCE_SOURCE.load().done((result) => {
      absenceData = result
    })
    OFFICE_SOURCE.load().done((result) => {
      officeData = result
    })
    j = new Date(j).getTime()
    if (teamID != 3) {
      $.each(absenceData, (i) => {
        const START = absenceData[i].startDate,
          END = absenceData[i].endDate;
        if (new Date(START).getTime() <= j && new Date(END).getTime() >= j) {
          salariePresent = salariePresent.filter(data => data.id !== absenceData[i].salarieID)
        }
      })
      $.each(officeData, (i) => {
        const OFFICE_START = new Date(officeData[i].startDate)
        let start,
          end
        switch (officeData[i].periodeID) {
          case 1:
            start = OFFICE_START.getTime() + (8 * S_IN_H)
            end = start + (4 * S_IN_H)
            break
          case 2:
            start = OFFICE_START.getTime() + (13 * S_IN_H)
            end = start + (5 * S_IN_H)
            break
          case 3:
            start = OFFICE_START.getTime() + (8 * S_IN_H)
            end = start + (12 * S_IN_H)
            break
        };
        if (start <= j && end >= j) {
          salariePresent = salariePresent.filter(data => data.id !== salOfficer())
        }
      })
    } else {
      salariePresent = salariePresent.filter(data => data.id == salOfficer())
      $.each(absenceData, (i) => {
        let start = absenceData[i].startDate,
          end = absenceData[i].endDate
        if (new Date(start).getTime() <= j && new Date(end).getTime() >= j) {
          salariePresent = salariePresent.filter(data => data.id !== absenceData[i].salarieID)
        }
      })
    }
    return salariePresent
  }

  /*Salarie pour l'appointment en fonction des salarié présent et des salarié par defaut de l'équipe */
  function getSalarieHereDefautEquip(j, teamID) {
    const TEAM = $.grep(TEAMS_STORE._array, (e) => {
      return e.id === teamID
    })
    const DEFAULT_SAL_ID = TEAM[0].defautSalId
    const SALARIE_HERE = getSalarieHere(j, teamID)
    let sal = []
    $.each(DEFAULT_SAL_ID, (y, val) => {
      $.each(SALARIE_HERE, (i, data) => {
        if (data.id === val) {
          sal.push(data.id)
        }
      })
    })
    return sal
  }

  /*update des heures de bureau après modification dans les options */
  function updateHoursOffice(e) {
    const DAY = e.element.data('day')
    const DAY_TIME = new Date(DAY).getTime()
    OFFICE_SOURCE.filter('startDate', DAY)
    OFFICE_SOURCE.load().done((result) => {
      if (result.length != 0 && e.value === null) {
        OFFICE_STORE.remove(result[0].id)
      } else if (result.length != 0 && e.value !== null) {
        OFFICE_STORE.update(result[0].id, {
          periodeID: e.value
        })
      } else {
        OFFICE_STORE.insert({
          startDate: DAY,
          periodeID: e.value
        })
      }
      SCHEDULER.repaint()
      SCHEDULER.on([{
        'repaint': afterRepaint()
      }])
    })
  }

  /*definir le DATA pour les ressources equipe dans le scheduler
  est modifié par l'option affichage des équipes*/
  function getDataTeams(value, d) {
    let j = new Date(d).getTime()
    let equipeShowInScheduler = []
    if (TEAMS_STORE._array.length > 0) {
      $.each(value, (i, val) => {
        const TEAM = $.grep(TEAMS_STORE._array, (e) => {
          return e.id === val
        })
        if (new Date(TEAM[0].startDate).getTime() <= j && new Date(TEAM[0].endDate).getTime() >= j) {
          equipeShowInScheduler.push(TEAM[0])
        }
      })
    } else {
      equipeShowInScheduler = [{
        'id': '1'
      }]
    }
    return equipeShowInScheduler
  }

  /*Date désactivé dans le formulaire de Planning*/
  function disableDate(args) {
    let isChome
    const Chome = $.grep(CHOME_STORE._array, (e) => {
      const START_DATE = new Date(e.startDate)
      const END_DATE = new Date(e.endDate)
      return args.date.getTime() >= START_DATE.getTime() && args.date.getTime() <= END_DATE.getTime() - 60000
    })
    Chome.length > 0 ? isChome = true : isChome = false
    const DAY_WEEK = args.date.getDay()
    const WEEKEND = DAY_WEEK === 0 || DAY_WEEK === 6
    const RESULT = new Object()
    RESULT.chome = isChome
    RESULT.weekend = WEEKEND
    return RESULT
  }

  //message création d'un client dans jardin
  function msgCreateClient(item, e) {
    const MSG_CREATE_CLIENT = DevExpress.ui.dialog.confirm('Voulez vous créer un client dans l\'application <i>jardin?</i>', 'Créer un client');
    MSG_CREATE_CLIENT.done((msg) => {
      if (msg) {
        createPopupAddClient(item, e)
      }
    })
  }

  function dateFinActualise(date, e) {
    let startDate = new Date(date)
    let oldEndDate = new Date(e.appointmentData.endDate)
    let oldStartDate = new Date(e.appointmentData.startDate)
    let duration = oldEndDate.getTime() - oldStartDate.getTime()
    let endDate = new Date(startDate.valueOf() + duration)
    endDate.getHours() > 17 ? endDate.setHours(17, 0) : endDate
    return endDate
  }

  /*date du scheduler*/
  function getDate() {
    return getDateFormatAAAAMD(SCHEDULER.option('currentDate'))
  }

  /*relatif aux <SEMAINE>________________________________________________________________________*/

  /*numero de semaine sur le bouton*/
  function initWeekNumber() {
    $('#button-sem .dx-button-text').text(getWeekNumber(SCHEDULER.option('currentDate')))
  }

  /*création du contenaire qui acceuil le boutton semaine dans le header du scheduler*/
  function createSemContainer() {
    const WRAPPER_WEEK = $('<div />')
      .appendTo('.dx-scheduler-header .dx-toolbar-items-container .dx-toolbar-after')
      .addClass('wrapper-sem')
    const BUTTON_LABEL = $('<div />')
      .appendTo(WRAPPER_WEEK)
      .addClass('sem-label')
      .text('semaine')
    const WRAPPER_BUTTON = $('<div />')
      .appendTo(WRAPPER_WEEK)
      .attr({
        id: 'button-sem',
        class: 'sem'
      })
    const BUTTON_SEM = $('#button-sem').dxButton({
      stylingMode: 'outlined',
      text: '0',
      type: 'normal',
      width: 36,
      onClick: () => {
        createPopupOption({
          contentOption: POPUP_WEEK
        })
      }
    })
  }

  /*définir jour date premier jour semaine et date fin semaine*/
  function dateStartEndCurrentSem(day) {
    let dayS = new Date(day),
      dayE = new Date(dayS),
      d
    day.getDay() == 0 ? d = 6 : d = day.getDay() - 1
    dayS.setDate(day.getDate() - d)
    dayE.setDate(dayS.getDate() + 6)
    dayS = getDateFormatAAAAMMDD(dayS)
    dayE = getDateFormatAAAAMMDD(dayE)
    class appointementDate {
      constructor(s, e) {
        this.dateStart = s
        this.dateEnd = e
      }
    }
    result = new appointementDate(dayS, dayE)
    return result
  }

  /*obtenir le numéro de semaine de la semaine affichée dans le scheduler*/
  function getWeekNumber(day) {
    let j
    if (day.getDay() == 0) {
      j = day.getDate() + 1
    } else {
      j = day.getDate()
    }
    day = new Date(Date.UTC(day.getFullYear(), day.getMonth(), j))
    day.setUTCDate(day.getUTCDate() + 4 - (day.getUTCDay() || 7))
    const YEAR_START = new Date(Date.UTC(day.getUTCFullYear(), 0, 1))
    const WEEK_NUM = Math.ceil((((day - YEAR_START) / 86400000) + 1) / 7)
    return WEEK_NUM
  }

  /*obtenir année de la semaine affichée dans le scheduler*/
  function getYear(day) {
    const YEAR = day.getFullYear()
    return YEAR
  }

  /*obtenir les paramètres pour les Contrats annuels*/
  function getParamAnnuel(day) {
    const PARAM = new Object()
    PARAM.sem = getWeekNumber(day)
    PARAM.year = getYear(day)
    return PARAM
  }

  /*déplacement vers la semaine choisi dans le popup semaine*/
  function goWeek(sem, an) {
    let firstDayAn = new Date()
    firstDayAn.setUTCFullYear(an, 0, 1)
    let firstDayOfYear = firstDayAn.getDay(),
      firstDayLength = 8 - firstDayOfYear
    firstDayLength >= 4 ? semLenght = sem - 2 : semLenght = sem - 1
    let addDays = (semLenght * 7) + firstDayLength + 1,
      finalDate = new Date()
    finalDate.setFullYear(an, 0, addDays)
    let firstDayOfSem = new Date(finalDate)
    SCHEDULER.option('currentDate', firstDayOfSem)
  }

  /*relatif menu contextuel____________________________________________________________________________*/
  function updateContextMenu(disable, data, item, onItemClick, target) {
    CONTEXT_MENU.option({
      dataSource: data,
      target: target,
      itemTemplate: item,
      onItemClick: onItemClick,
      disabled: disable,
    })
  }

  function onItemClick(contextMenuEvent) {
    return (e) => {
      e.itemData.onItemClick(contextMenuEvent, e)
    }
  }

  function getAppointmentMenuTemplate(itemData) {
    const WRAPPER_TEMPLATE = $('<div />');
    if (itemData.hasOwnProperty('checked')) {
      WRAPPER_TEMPLATE.dxCheckBox({
        value: itemData.checked,
        text: itemData.text
      })
    } else {
      WRAPPER_TEMPLATE.append(itemData.text).addClass('appointment-context-menu')
    }
    return WRAPPER_TEMPLATE
  };

  function getCellMenuTemplate(itemData) {
    const WRAPPER_TEMPLATE = $('<div />')
    WRAPPER_TEMPLATE.append(itemData.text).addClass('cell-context-menu')
    return WRAPPER_TEMPLATE
  }

  //menu context des cellules
  function groupCell(e) {
    let now = SCHEDULER.option('groupByDate')
    now = !now
    now === true ? optionText = 'Grouper par équipe' : optionText = 'Grouper par date'
    cellContextMenuItems[1].text = optionText
    SCHEDULER.option('groupByDate', now)
  }

  function createAppointment(e) {
    e.component.showAppointmentPopup({
      startDate: new Date(e.cellData.startDate),
      endDate: new Date(e.cellData.startDate.getTime() + 30 * 60000),
      equipeID: e.cellData.groups.equipeID
    }, true)
  }

  function showCurrentDate(e) {
    e.component.option('currentDate', new Date())
  }

  //menu context des appointment
  function showAppointment(e) {
    e.component.showAppointmentPopup(e.appointmentData)
  }

  function deleteAppointment(e) {
    e.component.deleteAppointment(e.appointmentData)
    createItemElement(e.appointmentData, $(`#list${e.appointmentData.devis.typeID}`))
    $(`.sem-${getWeekNumber(SCHEDULER.option('currentDate'))}`).css('display', 'block');
  }

  function duplicateAppointment(e) {
    const APPOINTMENT = e.targetedAppointmentData
    APPOINTMENT.sdc ? delete APPOINTMENT.sdc : true
    delete APPOINTMENT.id
    e.component.addAppointment(APPOINTMENT)
  }

  function changeStatut(e, clickEvent) {
    const APPOINTMENT = e.appointmentData
    e.component.updateAppointment(
      APPOINTMENT, $.extend(APPOINTMENT, {
        statut: clickEvent.itemData.text
      })
    )
  }

  function salAppointment(e, clickEvent) {
    CONTEXT_MENU.option({
      disable: true
    })
    const APPOINTMENT = e.appointmentData
    const SALARIE = APPOINTMENT.salarieID
    const SALARIE_ITEM = clickEvent.itemData.id
    $.inArray(SALARIE_ITEM, SALARIE) != -1 ? SALARIE.splice(SALARIE.indexOf(SALARIE_ITEM), 1) : SALARIE.push(SALARIE_ITEM)
    e.component.updateAppointment(
      APPOINTMENT, $.extend(APPOINTMENT, {
        salarieID: SALARIE
      })
    )
    CONTEXT_MENU.show()
  }

  /*relatif au <Liste de chantier>________________________________________________________________________*/

  /*creation des listes dans le drawer pour les contrats annuels et ponctuels*/
  function createList(data) {
    const LISTE = $.each(data, (i, item) => {
      createItemElement(item, $(`#list${item.devis.typeID}`))
    })
  }

  /*creation des items des listes dans le drawer*/
  function createItemElement(item, container) {
    let classSem
    item.devis.typeID == 1 ? classSem = `itemSem sem-${item.contrat.sem}` : classSem = ''
    $('<div />')
      .text(item.devis.text)
      .addClass(`item dx-card dx-theme-background-color dx-theme-text-color item${item.devis.dvs_ref} ${classSem}`)
      .appendTo(container)
      .click(() => {
        createPopupDevisInfo(item)
      })
      .dxDraggable({
        group: 'dragging',
        data: item,
        clone: true,
        onDragEnd: (e) => {
          if (e.toData) {
            e.cancel = true;
          }
          isDrag === false ? e.cancel = true : e.cancel = false
        },
        onDragMove: (e) => {
          let hoverCell = $('.dx-scheduler-date-table-droppable-cell')
          if (hoverCell.hasClass('dx-template-chome')) {
            isDrag = false
            createToast(ALERT_APPOINTMENT_DISABLE)
          } else {
            isDrag = true
          }
        },
        onDragStart: (e) => {
          e.itemData = e.fromData;
        }
      })
    $('.itemSem').css('display', 'none')
    $(`.sem-${getWeekNumber(SCHEDULER.option('currentDate'))}`).css('display', 'block')
  }

  /*relatif au <Options>________________________________________________________________________*/
  /*OPTION1 :creation du switch 'grouper par date' dans les options du drawer	*/
  function createOptionGroupByDate() {
    const WRAPPER_SWITCH = $('<div />').addClass('switchGroupe option-groupe')
    const WRAPPER_SWITCH_TITLE = $('<span />').text('Grouper par date').addClass('switchGroupLabel')
    $('.groupChanged').append(WRAPPER_SWITCH_TITLE).append(WRAPPER_SWITCH)
    const GROUP_BY_DATE_OPTION = $('.switchGroupe').dxSwitch({
      name: 'groupByDate',
      width: 30,
      value: true,
      onValueChanged: (args) => {
        SCHEDULER.option('groupByDate', args.value)
        SCHEDULER.on([{
          'repaint': afterRepaint()
        }])
      }
    })
  }

  /*OPTION2:creation du choix des equipes afficher dans le scheduler	*/
  function createOptionTeams() {
    $('.switchEquip').empty()
    let array = PARAM_STORE._array[0].teams
    $.each(TEAMS_STORE._array, (el, value) => {
      let startDate = value.startDate,
        endDate = value.endDate,
        j = SCHEDULER.option('currentDate')
      if (new Date(startDate).getTime() <= j && new Date(endDate).getTime() >= j) {
        let val
        array.indexOf(value.id) !== -1 ? val = true : val = false
        $('<div />').attr('id', `checkboxTeam${value.id}`).addClass('checkboxTeam').appendTo('.switchEquip')
        const CHECKBOX = $(`#checkboxTeam${value.id}`).dxCheckBox({
          text: value.text,
          value: val,
          onValueChanged: (e) => {
            if (e.value === true) {
              array.push(value.id);
              SCHEDULER.option('resources[0].dataSource', getDataTeams(array, SCHEDULER.option('currentDate')))
              PARAM_STORE.update(PARAM_STORE._array[0].id, {
                teams: array
              })
            } else {
              array = array.filter(e => e !== value.id)
              if (array.length == 0) {
                createToast(ALERT_TEAM)
                CHECKBOX.option('value', true)
              } else {
                SCHEDULER.option('resources[0].dataSource', getDataTeams(array, SCHEDULER.option('currentDate')))
                PARAM_STORE.update(PARAM_STORE._array[0].id, {
                  teams: array
                })
              }
            }
          }
        }).dxCheckBox('instance')
      }
    })
  }

  /*création des boutons d'options de l'accordion */
  function createButtonOption(e) {
    const WRAPPER_BTN = $('<div />').addClass('bt-option')
    const BTN = ($('<div />').addClass('button-option'))
    WRAPPER_BTN.append(BTN)
    e.group.append(WRAPPER_BTN)
    BTN.dxButton({
      text: e.text,
      icon: e.icon,
      elementAttr: {
        class: e.className
      },
      type: 'normal',
      onClick: () => {
        if (e.event.fmScript) {
          if (e.event.fmScript.param) {
            let func = e.event.fmScript.param
            param = func()
          } else {
            param = ''
          }
          queryToFM(new queryFM(e.event.fmScript.name, param, 0))
          return true
        } else {
          let func = e.event.intern.name,
            param = e.event.intern.param
          func(param)
        }
      }
    })
  }

  /*récupération des travaux de la semaine pour les fiche chantier*/
  function ficheTravSemaine() {
    let result
    const ficheTrav = new DevExpress.data.DataSource({
      paginate: false,
      store: APPOINTMENT_STORE,
      filter: [
        ['startDate', '>', getDateFormatAAAAMMDD_H(SCHEDULER.getStartViewDate())],
        'and',
        ['endDate', '<', getDateFormatAAAAMMDD_H(SCHEDULER.getEndViewDate())]
      ],
      sort: 'startDate'
    });
    ficheTrav.load().done((r) => {
      result = JSON.stringify(ficheTrav._items)
    })
    return result
  }

  /*création de la fiche chantier de l'appointmnt en cour*/
  function ficheTrav(e) {
    let ficheTrav = []
    ficheTrav.push(e.appointmentData)
    const PARAM = JSON.stringify(ficheTrav)
    queryToFM(new queryFM('Creation_fiche_chantier', PARAM, 0))
  }

  /*contact du client et création du popup*/
  function contactClient(e) {
    getDataClient(e.appointmentData.devis.client.clt_ref)
    setDataClient = (val) => {
      clt = JSON.parse(val);
      createPopupContacter(e, clt)
    }
  }

  /*creation et ouverture des popups d'option	*/
  function createPopupOption(param) {
    class CREATE_POPUP {
      constructor(popupContentOption) {
        this.contentOption = popupContentOption
        this.startPopup = () => {
          if (popupOption) {
            popupOption = $('#popupOption').dxPopup(popupContentOption).dxPopup('instance')
          } else {
            let container = $('<div />').attr('id', 'popupOption').appendTo('#planning')
            popupOption = $('#popupOption').dxPopup(popupContentOption).dxPopup('instance')
          }
          popupOption.show()
        }
      }
    }
    const CREATED_POPUP = new CREATE_POPUP(param.contentOption)
    CREATED_POPUP.startPopup()
  }

  /* creation du Toast*/
  function createToast(param) {
    class CREATE_TOAST {
      constructor(param) {
        this.startToast = () => {
          if (toastOption) {
            toastOption = $('#toast').dxToast(param).dxToast('instance')
          } else {
            let wrapper = $('<div />').attr('id', 'toast').appendTo('#planning')
            toastOption = wrapper.dxToast(param).dxToast('instance')
          }
          toastOption.show()
        }
      }
    }
    const CREATED_TOAST = new CREATE_TOAST(param)
    CREATED_TOAST.startToast()
  }

  /*creation et ouverture du popup d'information sur les devis */
  function createPopupDevisInfo(e) {
    if (popupDevisInfo) {
      popupDevisInfo.option({
        'contentTemplate': popupDevisInfoContent(e).contentTemplate.bind(this),
      })
    } else {
      $('<div />').attr('id', 'popup-devis-info').appendTo('#planning')
      popupDevisInfo = $('#popup-devis-info').dxPopup(popupDevisInfoContent(e)).dxPopup('instance')
    }
    popupDevisInfo.show()
  }

  /*creation et ouverture du popup enregistrement du suivi de chantier */
  function createPopupTimeResult(e) {
    if (popupTimeResult) {
      popupTimeResult.option({
        'contentTemplate': popupTimeResultContent(e).contentTemplate.bind(this),
        'title': 'suivi de chantier'
      })
    } else {
      $('<div />').attr('id', 'popup-time-result').appendTo('#planning')
      popupTimeResult = $('#popup-time-result').dxPopup(popupTimeResultContent(e)).dxPopup('instance')
    }
    popupTimeResult.show()
  }

  /*creation et ouverture du popup nouveau Client */
  function createPopupAddClient(item, e) {
    $('<div />').attr('id', 'popup-new-client').appendTo('#planning')
    popupAddClient = $('#popup-new-client').dxPopup(popupAddClientContent(item, e)).dxPopup('instance')
    popupAddClient.show()
  }

  /*creation et ouverture du popup Contacter */
  function createPopupContacter(e, clt) {
    if (popupContacter) {
      popupContacter.option({
        'contentTemplate': popupContacterContent(e, clt).contentTemplate.bind(this),
        'title': e.appointmentData.devis.text
      })
    } else {
      $('<div />').attr('id', 'popup-contact').appendTo('#planning')
      popupContacter = $('#popup-contact').dxPopup(popupContacterContent(e, clt)).dxPopup('instance')
    }
    popupContacter.show()
  }

  /*creation et ouverture du popup SMS */
  function createPopupSMS(e, smsTel, clt) {
    if (popupSMS) {
      popupSMS.option({
        'contentTemplate': popupSMSContent(e, smsTel, clt).contentTemplate.bind(this),
        'title': 'sms'
      })
    } else {
      $('<div />').attr('id', 'popup-sms').appendTo('#planning')
      popupSMS = $('#popup-sms').dxPopup(popupSMSContent(e, smsTel, clt)).dxPopup('instance')
    }
    popupSMS.show()
  }

  /*envois du SMS*/
  function sendInBlue(num, content) {
    let options = {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'api-key': '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'
      },
      body: JSON.stringify({
        type: 'transactional',
        unicodeEnabled: false,
        sender: '33610225002',
        recipient: num,
        content: content,
        organisationPrefix: 'Proxim Jardin'
      })
    },
      url = 'https://api.brevo.com/v3/transactionalSMS/sms'
    fetch(url, options)
      .then(response => response.json())
      .then(function () {
        createToast(ALERT_SMS_SUCCESS)
      })
      .catch(error => console.log(error)
      )
  }

  //____________________________________________________________________________________________________
  function popupDevisInfoContent(e) {
    console.log(e)
    let appointment
    e.appointmentData ? appointment = e.appointmentData : appointment = e
    const DEVIS_INFO_POPUP = {
      width: 500,
      height: 450,
      showTitle: true,
      title: 'Information sur le devis',
      visible: false,
      dragEnabled: true,
      closeOnOutsideClick: true,
      showCloseButton: true,
      shading: true,
      shadingColor: 'rgba(134, 134, 134, 0.70)',
      wrapperAttr: {
        class: 'devis-info-popup'
      },
      contentTemplate: () => {
        const WRAPPER_DEVIS_INFO_POPUP = $('<div />')
        const WRAPPER_DEVIS_INFO = $('<div />').appendTo(WRAPPER_DEVIS_INFO_POPUP).addClass('wrapper-info-devis-form').css("margin-top", "5px")
        WRAPPER_DEVIS_INFO.dxForm({
          readOnly: false,
          showColonAfterLabel: true,
          labelMode: 'floating',
          labelLocation: 'top',
          minColWidth: 200,
          height: 'auto',
          colCount: 1,
          showValidationSummary: false,
          validationGroup: 'formDevisInfo',
          items: [{
            itemType: 'group',
            cssClass: 'adresse-group',
            colCount: 3,
            items: [{
              name: 'adresse',
              dataField: 'adresse',
              colSpan: 3,
              label: {
                text: 'Adresse chantier',
                visible: false
              },
              editorOptions: {
                value: appointment.devis.adresse.adrch,
                disabled: false,
                readOnly: true
              },
            }, {
              dataField: 'ville',
              colSpan: 2,
              label: {
                text: 'Ville',
                visible: false
              },
              editorOptions: {
                value: appointment.devis.adresse.adrch_ville,
                disabled: false,
                readOnly: true,
              },
            }, {
              name: 'button_nouveau_client',
              label: {
                visible: false
              },
              editorType: 'dxButton',
              editorOptions: {
                width: '100%',
                text: 'map',
                type: 'success',
                elementAttr: {
                  class: 'button-map'
                },
                onClick: () => {
                  let param = new Object()
                  param.adresse = appointment.devis.adresse
                  const PARAM = JSON.stringify(param)
                  queryToFM(new queryFM('map adresse chantier', PARAM, 0))
                }
              }
            }]
          }]
        }).dxForm('instance')
        const WRAPPER_CONTENU_DEVIS_INFO = $('<div />').addClass('ja-textarea').appendTo(WRAPPER_DEVIS_INFO_POPUP)
        const WRAPPER_CONTENU = $('<div />').attr('id', 'contenu_devis').addClass('container-cont').appendTo(WRAPPER_CONTENU_DEVIS_INFO)
        const WRAPPER_TOOLBAR_DETAIL = $('<div />').addClass('toolbar-time-result').appendTo(WRAPPER_CONTENU_DEVIS_INFO)
       /* if (appointment.contrat.description) {
          const TREELIST_DETAIL_DEVIS = WRAPPER_CONTENU.dxTreeList({
            dataSource: appointment.contrat.detail.cont,
            itemsExpr: 'sub_cont',
            dataStructure: 'tree',
            columns: [{
              dataField: 'description',
              caption: 'Description',
              cellTemplate(container, e) {
                console.log(e)
                const DESCR = e.data.description;
                container
                  .append($('<span>', { class: 'descr', html: DESCR }));
              }
            }, {
              dataField: 'h_prevu',
              caption: 'H',
            }],
            selection: {
              mode: 'multiple',
              recursive: true,
            },
            autoExpandAll: true,
            showRowLines: true,
            showBorders: true,
            columnAutoWidth: true,
            wordWrapEnabled: true,
            onRowPrepared: (e) => {
              if (e.level == 0 || e.rowType === 'header') {
                e.rowElement.find('td').css('font-weight', '1000');
              }

            },
            onCellPrepared: (e) => {
              if (e.rowType == 'data' && e.row.level == 0) {
                e.cellElement.find('div.dx-treelist-icon-container').remove()
              }
            },
            onNodesInitialized: (e) => {
              let arraySelectedRow = new Array()
              TREELIST_DETAIL_DEVIS.forEachNode(function (node) {
                let nodeData = node.data
                if (nodeData.termine === 1) {
                  let valeurId = nodeData.id
                  arraySelectedRow.push(valeurId)
                }
              })
              TREELIST_DETAIL_DEVIS.option("selectedRowKeys", arraySelectedRow)
            }
          }).dxTreeList('instance')
         } else {*/
          const TREELIST_DETAIL_DEVIS = WRAPPER_CONTENU.dxTreeList({
            dataSource: appointment.devis.detail.cont,
            itemsExpr: 'sub_cont',
            dataStructure: 'tree',
            columns: [{
              dataField: 'descr',
              caption: 'Description',
              cellTemplate(container, e) {
                const DESCR = e.data.descr;
                container
                  .append($('<span>', { class: 'descr', html: DESCR }));
              }
            }, {
              dataField: 'h_prevu',
              caption: 'H',
            }],
            selection: {
              mode: 'multiple',
              recursive: true,
            },
            autoExpandAll: true,
            showRowLines: true,
            showBorders: true,
            columnAutoWidth: true,
            wordWrapEnabled: true,
            onRowPrepared: (e) => {
              if (e.level == 0 || e.rowType === 'header') {
                e.rowElement.find('td').css('font-weight', '1000');
              }

            },
            onCellPrepared: (e) => {
              if (e.rowType == 'data' && e.row.level == 0) {
                e.cellElement.find('div.dx-treelist-icon-container').remove()
              }
            },
            onNodesInitialized: (e) => {
              let arraySelectedRow = new Array()
              TREELIST_DETAIL_DEVIS.forEachNode(function (node) {
                let nodeData = node.data
                if (nodeData.termine === 1) {
                  let valeurId = nodeData.id
                  arraySelectedRow.push(valeurId)
                }
              })
              TREELIST_DETAIL_DEVIS.option("selectedRowKeys", arraySelectedRow)
            }
          }).dxTreeList('instance')
        //}
        const TOOLBAR_DETAIL = WRAPPER_TOOLBAR_DETAIL.dxToolbar({
          items: [{
            toolbar: 'bottom',
            widget: 'dxButton',
            location: 'after',
            options: {
              text: 'valider',
              onClick: () => {
                const SCDVS_SELECTED = TREELIST_DETAIL_DEVIS.getSelectedRowKeys('leavesOnly')
                console.log(e)
                $.each(appointment.devis.detail.cont, (i, cont) => {
                  $.each(cont.sub_cont, (i, sub_cont) => {
                    if (SCDVS_SELECTED.includes(sub_cont.id)) {
                      sub_cont.termine = 1
                    } else {
                      sub_cont.termine = 0
                    }
                  })
                })
                e.component.updateAppointment(appointment, appointment)
                let result = new Object()
                result.data = SCDVS_SELECTED
                result.structure = appointment.devis.structure
                result.dvs_ref = appointment.devis.dvs_ref
                result = JSON.stringify(result)
                console.log(result)
                queryToFM(new queryFM('scdvsTermine', result, 0))
                popupDevisInfo.hide()
              }
            }
          }, {
            toolbar: 'bottom',
            widget: 'dxButton',
            location: 'after',
            options: {
              text: 'Annuler',
              onClick: () => {
                popupDevisInfo.hide()
              }
            }
          }
          ]
        }).dxToolbar('instance')
        WRAPPER_DEVIS_INFO_POPUP.dxScrollView({
          height: "100%",
          width: "100%"
        }).dxScrollView('instance')
        return WRAPPER_DEVIS_INFO_POPUP

      }
    }
    return DEVIS_INFO_POPUP
  }

  //____________________________________________________________________________________________________
  function popupTimeResultContent(e) {
    const TIME_RESULT_POPUP = {
      width: 700,
      height: 450,
      showTitle: true,
      title: 'Temps passé sur le chantier',
      visible: false,
      dragEnabled: true,
      closeOnOutsideClick: true,
      showCloseButton: true,
      shading: true,
      shadingColor: 'rgba(134, 134, 134, 0.70)',
      wrapperAttr: {
        class: 'time-result-popup'
      },
      contentTemplate: () => {
        const WRAPPER_TIME_RESULT_POPUP = $('<div />')
        const WRAPPER_TIME_RESULT = $('<div />').appendTo(WRAPPER_TIME_RESULT_POPUP)
        const WRAPPER_TIME_RESULT_GRID = $('<div />').appendTo(WRAPPER_TIME_RESULT_POPUP)
        const WRAPPER_TOOLBAR_TIME_RESULT = $('<div />').addClass('toolbar-time-result').appendTo(WRAPPER_TIME_RESULT_POPUP)
        const APPOINTMENT = e.appointmentData
        let data_worker,
          sdc

        !APPOINTMENT.sdc || APPOINTMENT.sdc.length == 0 ? sdc = false : sdc = true
        !sdc ? data_worker = new Array() : data_worker = APPOINTMENT.sdc

        const MASK_HEURE = {
          H: char => char >= 0 && char <= 2,
          h: (char, index, fullStr) => {
            if (fullStr[0] == '2')
              return [0, 1, 2, 3].includes(parseInt(char));
            else
              return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].includes(parseInt(char));
          },
          M: char => char >= 0 && char <= 5,
          m: char => char >= 0 && char <= 9
        }
        const DATE = getDateFormatDDMMAAAA(new Date(APPOINTMENT.startDate))
        const DVS_REF = APPOINTMENT.devis.dvs_ref
        if (!sdc) {
          $.each(APPOINTMENT.salarieID, (i, elem) => {
            let objWorker = new Object()
            SALARIE_STORE.load({
              filter: ['id', elem]
            }).done(result => {
              const NAME = `${result[0].prenom} ${result[0].nom}`
              objWorker.salarie_name = NAME
              objWorker.dvs_ref = DVS_REF
              objWorker.date = DATE
            })
            data_worker.push(objWorker)
          })
        }
        const GRID_TIME_RESULT = WRAPPER_TIME_RESULT_GRID.dxDataGrid({
          dataSource: data_worker,
          showBorders: true,
          editing: {
            mode: 'popup',
            allowUpdating: true,
            allowAdding: true,
            allowDeleting: true,
            popup: {
              showTitle: false,
              width: 500,
              height: 350,
            },
            form: {
              items: [{
                itemType: 'group',
                colSpan: 2,
                colCount: 2,
                items: [{
                  dataField: 'salarie_name',
                  editorType: 'dxSelectBox',
                  editorOptions: {
                    dataSource: SALARIE_SOURCE,
                    valueExpr: (e) => {
                      if (e != null) {
                        return `${e.prenom} ${e.nom}`
                      }
                    },
                    displayExpr: (e) => {
                      if (e != null) {
                        return `${e.prenom} ${e.nom}`
                      }
                    }
                  }
                }]
              }, {
                itemType: 'group',
                colSpan: 2,
                colCount: 3,
                items: [
                  { dataField: 'heure_a' },
                  { dataField: 'heure_d' },
                  { dataField: 'trajet' }
                ]
              }, {
                itemType: 'group',
                colCount: 2,
                items: [
                  { dataField: 'pause_a' },
                  { dataField: 'pause_d' }]
              }]
            }
          },
          columns: [
            {
              allowEditing: false,
              dataField: 'appointmentID',
              visible: false,
            }, {
              dataField: 'salarie_name',
              caption: 'Nom',
              validationRules: [{
                type: 'required',
                message: 'requis'
              }]
            }, {
              dataField: 'heure_a',
              caption: 'heure d\'arrivée',
              editorOptions: {
                mask: 'Hh:Mm',
                maskRules: MASK_HEURE,
                useMaskedValue: true,
                showMaskMode: 'onFocus'
              }
            }, {
              dataField: 'heure_d',
              caption: 'heure de départ',
              editorOptions: {
                mask: 'Hh:Mm',
                maskRules: MASK_HEURE,
                useMaskedValue: true,
                showMaskMode: 'onFocus'
              }
            }, {
              dataField: 'trajet',
              caption: 'temps de trajet',
              validationRules: [{
                type: 'required',
                message: 'requis'
              }]
            }, {
              dataField: 'pause_a',
              caption: 'début de pause',
              editorOptions: {
                mask: 'Hh:Mm',
                maskRules: MASK_HEURE,
                useMaskedValue: true,
                showMaskMode: 'onFocus'
              }
            }, {
              dataField: 'pause_d',
              caption: 'fin de pause',
              editorOptions: {
                mask: 'Hh:Mm',
                maskRules: MASK_HEURE,
                useMaskedValue: true,
                showMaskMode: 'onFocus'
              }
            }],
          onRowInserting: (e) => {
            e.data.date = DATE
            e.data.dvs_ref = DVS_REF
            !e.data.pause_a ? e.data.pause_a = "" : true
            !e.data.pause_d ? e.data.pause_d = "" : true
          }
        }).dxDataGrid('instance')
        if (!sdc) {
          const FORM_TIME_RESULT = WRAPPER_TIME_RESULT.dxForm({
            readOnly: false,
            showColonAfterLabel: true,
            labelMode: 'floating',
            labelLocation: 'top',
            minColWidth: 200,
            height: 'auto',
            colCount: 1,
            showValidationSummary: false,
            validationGroup: 'formTimeResult',
            items: [
              {
                itemType: 'group',
                cssClass: 'info-group',
                colCount: 3,
                items: [{
                  dataField: 'heure_a',
                  label: {
                    text: 'Heure d\'arrivée',
                    visible: false
                  },
                  editorOptions: {
                    value: '',
                    mask: 'Hh:Mm',
                    maskRules: MASK_HEURE,
                    useMaskedValue: true,
                    showMaskMode: 'onFocus'
                  },
                  validationRules: [{
                    type: 'required',
                    message: 'requis'
                  }]
                }, {
                  dataField: 'heure_d',
                  label: {
                    text: 'Heure de départ',
                    visible: false
                  },
                  editorOptions: {
                    value: '',
                    mask: '00:00',
                    maskRules: MASK_HEURE,
                    useMaskedValue: true,
                    showMaskMode: 'onFocus'
                  },
                  validationRules: [{
                    type: 'required',
                    message: 'requis'
                  }]
                }, {
                  dataField: 'trajet',
                  label: {
                    text: 'Temps de trajet',
                    visible: false
                  },
                  editorOptions: {
                    value: '',
                  },
                  validationRules: [{
                    type: 'required',
                    message: 'requis'
                  }]
                }, {
                  dataField: 'pause_a',
                  label: {
                    text: 'début de pause',
                    visible: false
                  },
                  editorOptions: {
                    value: '',
                    mask: '00:00',
                    maskRules: MASK_HEURE,
                    useMaskedValue: true,
                    showMaskMode: 'onFocus'
                  }
                }, {
                  dataField: 'pause_d',
                  label: {
                    text: 'fin de pause',
                    visible: false
                  },
                  editorOptions: {
                    value: '',
                    mask: '00:00',
                    maskRules: MASK_HEURE,
                    useMaskedValue: true,
                    showMaskMode: 'onFocus'
                  }
                }]
              }],
            onFieldDataChanged: (e) => {
              $.each(data_worker, (i, elem) => {
                if (e.dataField == 'heure_a') {
                  elem.heure_a = e.value
                } else if (e.dataField == 'heure_d') {
                  elem.heure_d = e.value
                } else if (e.dataField == 'trajet') {
                  elem.trajet = e.value
                } else if (e.dataField == 'pause_a') {
                  elem.pause_a = e.value
                } else {
                  elem.pause_d = e.value
                }
              })
              GRID_TIME_RESULT.refresh()
            }
          }).dxForm('instance')
        }
        if (!sdc) {
          const TOOLBAR_TIME_RESULT = WRAPPER_TOOLBAR_TIME_RESULT.dxToolbar({
            items: [{
              toolbar: 'bottom',
              widget: 'dxButton',
              location: 'after',
              options: {
                text: 'valider',
                validationGroup: 'formTimeResult',
                onClick: function validate(params) {
                  let valid = params.validationGroup.validate()
                  if (valid.isValid === true) {
                    let dataSource = GRID_TIME_RESULT.option('dataSource')
                    e.component.updateAppointment(
                      APPOINTMENT, $.extend(APPOINTMENT, {
                        sdc: dataSource
                      })
                    )
                    let result = new Object()
                    result.data = dataSource
                    result.structure = APPOINTMENT.devis.structure
                    result.appointmentID = APPOINTMENT.id
                    result = JSON.stringify(result)
                    queryToFM(new queryFM('createSuiviChantier', result, 0))
                    popupTimeResult.hide()
                  }
                }
              }
            }, {
              toolbar: 'bottom',
              widget: 'dxButton',
              location: 'after',
              options: {
                text: 'Annuler',
                onClick: () => {
                  popupTimeResult.hide()
                }
              }
            }
            ]
          }).dxToolbar('instance')
        } else {
          const TOOLBAR_TIME_RESULT = WRAPPER_TOOLBAR_TIME_RESULT.dxToolbar({
            items: [{
              toolbar: 'bottom',
              widget: 'dxButton',
              location: 'after',
              options: {
                text: 'valider',
                onClick: () => {
                  let dataSource = GRID_TIME_RESULT.option('dataSource')
                  if (dataSource.length == 0) {
                    dataSource = JSON.stringify(dataSource)
                    queryToFM(new queryFM('createSuiviChantier', dataSource, 0))
                    popupTimeResult.hide()
                  } else {
                    e.component.updateAppointment(
                      APPOINTMENT, $.extend(APPOINTMENT, {
                        sdc: dataSource
                      })
                    )
                    let result = new Object()
                    result.data = dataSource
                    result.structure = APPOINTMENT.devis.structure
                    result.appointmentID = APPOINTMENT.id
                    result = JSON.stringify(result)
                    queryToFM(new queryFM('createSuiviChantier', result, 0))
                    popupTimeResult.hide()
                  }
                }
              }
            }, {
              toolbar: 'bottom',
              widget: 'dxButton',
              location: 'after',
              options: {
                text: 'Annuler',
                onClick: () => {
                  popupTimeResult.hide()
                }
              }
            }
            ]
          }).dxToolbar('instance')
        }
        return WRAPPER_TIME_RESULT_POPUP
      }
    }
    return TIME_RESULT_POPUP
  }

  //________________________________________________________________________________________


  function popupContacterContent(e, clt) {
    const CONTACT_POPUP = {
      colCount: 2,
      width: 390,
      height: 350,
      showTitle: true,
      title: e.appointmentData.devis.text,
      visible: false,
      dragEnabled: false,
      closeOnOutsideClick: true,
      showCloseButton: true,
      shading: true,
      shadingColor: 'rgba(134, 134, 134, 0.70)',
      wrapperAttr: {
        class: 'popup-contacter'
      },
      contentTemplate: () => {
        const WRAPPER_CONTACT_POPUP = $('<div />').addClass('containerContact')
        const WRAPPER_TEL = $('<div />').appendTo(WRAPPER_CONTACT_POPUP)
        const TEL_NUM = $('<div />').addClass('tel-content').appendTo(WRAPPER_TEL)
        let tel1,
          tel2,
          smsTel,
          mail
        if (clt.hasOwnProperty('contact')) {
          $('<div />').html(`<p>Les informations de contact suivante sont celles de ${clt.contact.nom}</br>${clt.contact.observation} </p>`).prependTo(WRAPPER_CONTACT_POPUP)
          tel1 = clt.contact.tel1
          tel2 = clt.contact.tel2
          mail = clt.contact.mail
          contactNom = clt.contact.nom
        } else {
          tel1 = clt.tel1
          tel2 = clt.tel2
          mail = clt.mail
          contactNom = ''
        }
        if (tel2.substring(0, 2) === '06' || tel2.substring(0, 2) === '07') {
          smsTel = tel2
        } else if (tel1.substring(0, 2) === '06' || tel1.substring(0, 2) === '07') {
          smsTel = tel1
        }
        $('<div />').addClass('tel').dxTextBox({
          value: tel1,
          readOnly: true,
          label: 'Téléphone',
          labelMode: 'static'
        }).appendTo(TEL_NUM);
        $('<div />').addClass('tel').dxTextBox({
          value: tel2,
          readOnly: true,
        }).appendTo(TEL_NUM)
        if (typeof (smsTel) != 'undefined') {
          const WRAPPER_SMS_BUTTON = $('<div />').addClass('sms-button-content').appendTo(WRAPPER_TEL)
          const SMS_BUTTON = $('<div />').addClass('button-mail')
          SMS_BUTTON.dxButton({
            width: 120,
            text: 'SMS',
            type: 'success',
            onClick: () => {
              createPopupSMS(e, smsTel, clt)
            }
          }).appendTo(WRAPPER_SMS_BUTTON)
        }
        if (mail.length != 0) {
          const WRAPPER_MAIL = $('<div />').appendTo(WRAPPER_CONTACT_POPUP).css({
            'margin-top': '40px'
          })
          const MAIL_CONTENT = $('<div />').addClass('mail-content').appendTo(WRAPPER_MAIL)
          $('<div />').addClass('mail').dxTextBox({
            value: mail,
            readOnly: true,
            label: 'Email',
            labelMode: 'static'
          }).appendTo(MAIL_CONTENT)
          const BUTTON_MAIL = $('<div />').addClass('button-mail')
          BUTTON_MAIL.dxButton({
            width: 120,
            text: 'mail',
            type: 'success',
            onClick: () => {
              let mailText = getConfirmationMsg(e.appointmentData, clt, 'mail')
              let param = {
                'mail': mail,
                'mailText': mailText
              }
              param = JSON.stringify(param)
              queryToFM(new queryFM('creation_mail', param, 0))
              e.component.updateAppointment(
                e.appointmentData, $.extend(e.appointmentData, {
                  statut: 'Message'
                })
              )
            }
          }).appendTo(MAIL_CONTENT)
        }
        return WRAPPER_CONTACT_POPUP
      }
    }
    return CONTACT_POPUP
  }

  function popupSMSContent(e, smsTel, clt) {
    const SMS_POPUP = {
      colCount: 1,
      width: 390,
      height: 350,
      showTitle: true,
      title: 'sms',
      visible: false,
      dragEnabled: false,
      closeOnOutsideClick: true,
      showCloseButton: true,
      shading: true,
      shadingColor: 'rgba(134, 134, 134, 0.70)',
      wrapperAttr: {
        class: 'popup-sms'
      },
      contentTemplate: () => {
        const WRAPPER_SMS_POPUP = $('<div />').addClass('containersms')
        const WRAPPER_SMS = $('<div />').appendTo(WRAPPER_SMS_POPUP)
        smsText = getConfirmationMsg(e.appointmentData, clt, 'sms')
        $('<div />').addClass('sms').dxTextArea({
          value: smsText,
          readOnly: false,
          label: 'texte',
          labelMode: 'static',
          height: 200,
          onValueChanged: function (e) {
            smsText = e.value
          }
        }).appendTo(WRAPPER_SMS)
        const WRAPPER_SMS_BUTTON = $('<div />').addClass('sms-button-content').appendTo(WRAPPER_SMS)
        const SMS_BUTTON = $('<div />').addClass('button-sms')
        SMS_BUTTON.dxButton({
          text: 'envoyer',
          width: 150,
          type: 'success',
          onClick: () => {
            sendInBlue(smsNumTel(smsTel), smsText)
            $('#popup-sms').dxPopup('hide')
          }
        }).appendTo(WRAPPER_SMS_BUTTON)
        return WRAPPER_SMS_POPUP
      }
    }
    return SMS_POPUP
  }

  /*popup ajouter un client*/
  function popupAddClientContent(item, e) {
    let formAddClient
    const ADD_CLIENT_POPUP = {
      width: 500,
      height: 450,
      showTitle: true,
      title: 'ajouter un client',
      visible: false,
      dragEnabled: true,
      closeOnOutsideClick: true,
      shading: false,
      wrapperAttr: {
        class: 'addClient-popup'
      },
      contentTemplate: () => {
        const WRAPPER_ADD_CLIENT_POPUP = $('<div />').addClass('wrapper-AddClient-popup').dxScrollView({
          width: '100%',
          height: '100%'
        })
        formAddClient = WRAPPER_ADD_CLIENT_POPUP.dxForm({
          readOnly: false,
          showColonAfterLabel: true,
          labelMode: 'floating',
          labelLocation: 'top',
          minColWidth: 200,
          height: 320,
          colCount: 1,
          showValidationSummary: false,
          validationGroup: 'addClient',
          items: [{
            itemType: 'group',
            cssClass: 'nom-group',
            colCount: 5,
            items: [{
              dataField: 'civilite',
              colSpan: 1,
              label: {
                text: 'Civilité',
                visible: false
              },
              editorType: 'dxSelectBox',
              editorOptions: {
                items: ['M', 'Mme', 'M et Mme', 'M et M', 'Mme et Mme'],
                value: '',
                disabled: false,
                onOpened: (e) => {
                  setTimeout(() => {
                    e.component.content().parent().width(140)
                  });
                },
              },
              validationRules: [{
                type: 'required',
                message: 'la civilité est requise'
              }]
            }, {
              name: 'nom',
              dataField: 'nom',
              colSpan: 2,
              label: {
                text: 'Nom',
                visible: false
              },
              editorOptions: {
                value: '',
                disabled: false,
                width: 150
              },
              validationRules: [{
                type: 'required',
                message: 'le nom est requis'
              }]
            }, {
              dataField: 'prenom',
              colSpan: 2,
              label: {
                text: 'prénom',
                visible: false
              },
              editorOptions: {
                value: '',
                disabled: false,
                width: 150
              },
              validationRules: [{
                type: 'required',
                message: 'le prénom est requis'
              }]
            }]
          }, {
            itemType: 'group',
            cssClass: 'adresse-group',
            colCount: 1,
            items: [{
              dataField: 'adres1',
              label: {
                text: 'Adresse',
                visible: false
              },
              editorOptions: {
                value: '',
                disabled: false
              },
              validationRules: [{
                type: 'required',
                message: 'l\'adresse est requise'
              }]
            }, {
              dataField: 'adres2',
              label: {
                text: '',
                visible: false
              },
              editorOptions: {
                value: '',
                disabled: false
              }
            }, {
              itemType: 'group',
              cssClass: 'cp-ville-group',
              colCount: 5,
              items: [{
                dataField: 'cp',
                label: {
                  text: 'CP',
                  visible: false
                },
                editorOptions: {
                  value: '',
                  disabled: false,
                  mask: '00000',
                },
                validationRules: [{
                  type: 'required',
                  message: 'le code postal est requis'
                }]
              }, {
                dataField: 'ville',
                colSpan: 4,
                label: {
                  text: 'Ville',
                  visible: false
                },
                editorOptions: {
                  value: '',
                  disabled: false,
                },
                validationRules: [{
                  type: 'required',
                  message: 'la ville est requise'
                }]
              }]
            }]
          }, {
            itemType: 'group',
            cssClass: 'contact-group',
            colCount: 2,
            items: [{
              dataField: 'tel1',
              label: {
                text: 'Telephone',
                visible: false
              },
              editorOptions: {
                value: '',
                disabled: false,
                mask: '00 00 00 00 00',
              }
            }, {
              dataField: 'mail1',
              label: {
                text: 'Email',
                visible: false
              },
              editorOptions: {
                value: '',
                disabled: false
              }
            }, {
              dataField: 'tel2',
              label: {
                text: 'Telephone',
                visible: false
              },
              editorOptions: {
                value: '',
                mask: '00 00 00 00 00',
              }
            }, {
              dataField: 'mail2',
              label: {
                text: 'Email',
                visible: false
              },
              editorOptions: {
                value: '',
                disabled: false
              }
            }]
          }]
        }).dxForm('instance')
        return WRAPPER_ADD_CLIENT_POPUP
      },
      toolbarItems: [{
        toolbar: 'bottom',
        widget: 'dxButton',
        location: 'after',
        options: {
          text: 'ok',
          validationGroup: 'addClient',
          onClick: function validate(params) {
            const VALID = params.validationGroup.validate()
            if (VALID.isValid === true) {
              const NEW_CLIENT = formAddClient._options._optionManager._options.formData
              let param = JSON.stringify(NEW_CLIENT)
              param = echapElem(param)
              queryToFM(new queryFM('Creation_client', param, 0))
              const ADRESS = NEW_CLIENT.adres2 ? `${NEW_CLIENT.adres1}\n${NEW_CLIENT.adres2}` : `${NEW_CLIENT.adres1}`
              const TITLE = `${NEW_CLIENT.nom} ${NEW_CLIENT.prenom}`
              const CLIENT_TEXT = `${ADRESS}\n${NEW_CLIENT.ville}\n${NEW_CLIENT.tel1}\n${NEW_CLIENT.tel2}`
              e.form.option('items[0].items[0].editorOptions.value', TITLE)
              e.form.option('items[2].items[0].editorOptions.value', CLIENT_TEXT)
              e.form.option('items[2].items[2].editorOptions.value', item.clt_ref)
              popupAddClient.hide()
              $('#popup-new-client').remove()
            }
          }
        }
      }, {
        toolbar: 'bottom',
        widget: 'dxButton',
        location: 'after',
        options: {
          text: 'Annuler',
          onClick: (e) => {
            popupAddClient.hide()
            $('#popup-new-client').remove()
          }
        }
      }]
    }
    return ADD_CLIENT_POPUP
  }

  /*popup tagbox dans popup grid Equipe */
  function tagBoxEquipeDefautSalId(cellElement, cellInfo) {
    let salarie
    SALARIE_SOURCE.filter('actif', 1)
    SALARIE_SOURCE.load().done((result) => {
      salarie = result
    })
    const TAGBOX_SALARIE = $('<div>').dxTagBox({
      dataSource: salarie,
      value: cellInfo.value,
      valueExpr: 'id',
      displayExpr: 'prenom',
      showSelectionControls: true,
      maxDisplayedTags: 3,
      showMultiTagOnly: false,
      applyValueMode: 'useButtons',
      searchEnabled: true,
      onValueChanged: (e) => {
        cellInfo.setValue(e.value)
      },
      onSelectionChanged: () => {
        cellInfo.component.updateDimensions()
      },
      onOpened: (e) => {
        e.component._popup.option('width', 230)
      }
    })
    return TAGBOX_SALARIE
  }

  /*color picker dans popup grid Equipe */
  function colorPickerEquipe(cellElement, cellInfo) {
    return $('<div>').dxColorBox({
      value: cellInfo.value,
      onValueChanged: (e) => {
        cellInfo.setValue(e.value)
      },
      applyButtonText: 'ok',
    })
  }

  /*COMMUN*/
  /*Création d'un id*/
  function create_UUID() {
    let dt = new Date().getTime(),
      uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        let r = (dt + Math.random() * 16) % 16 | 0
        dt = Math.floor(dt / 16)
        return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16)
      })
    return uuid
  }

  /*Echapper les caractères spéciaux*/
  function echapElem(chaine) {
    chaine = chaine.replace(/'/g, "\''")
    chaine = chaine.replace(/\n|\r|(\n\r)/g, '/r')
    return chaine
  }

  /*date format aaaa/mm/dd    2022/06/08 */
  function getDateFormatAAAAMMDD(date) {
    let m = date.getMonth() + 1,
      d = date.getDate(),
      a = date.getFullYear()
    d < 10 ? d = `0${d}` : d
    m < 10 ? m = `0${m}` : m
    return `${a}/${m}/${d}`
  }

  /*date format aaaa/m/d     2022/6/8 */
  function getDateFormatAAAAMD(date) {
    let m = date.getMonth() + 1,
      d = date.getDate(),
      a = date.getFullYear()
    return `${a}/${m}/${d}`
  }

  /*date format dd/mm/aaaa => aaaa/m/d*/
  function getDateFormatDDMMAAAA_AAAAMD(date) {
    var dateParts = date.split('/')
    return `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`
  }

  /*date format aaaa/mm/dd hh:mm:ss*/
  function getDateFormatDDMMAAAA(date) {
    let m = date.getMonth() + 1,
      d = date.getDate(),
      a = date.getFullYear(),
      h = date.getHours(),
      n = date.getMinutes(),
      s = date.getSeconds()
    d < 10 ? d = `0${d}` : d
    m < 10 ? m = `0${m}` : m

    return `${d}/${m}/${a}`
  }

  /*date format aaaa/mm/dd hh:mm:ss*/
  function getDateFormatAAAAMMDD_H(date) {
    let m = date.getMonth() + 1,
      d = date.getDate(),
      a = date.getFullYear(),
      h = date.getHours(),
      n = date.getMinutes(),
      s = date.getSeconds()
    d < 10 ? d = `0${d}` : d
    m < 10 ? m = `0${m}` : m
    h < 10 ? h = `0${h}` : h
    n < 10 ? n = `0${n}` : n
    s < 10 ? s = `0${s}` : s
    return `${a}/${m}/${d} ${h}:${n}:${s}`
  }

  /*date format période*/
  function getRDVPeriode(e) {
    let date = new Date(e),
      m = date.getMonth(),
      j = date.getDay(),
      d = date.getDate(),
      h = (date.getHours() * 60) + date.getMinutes(),
      nomJour = new Array('dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'),
      nomMois = new Array('janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', ' août', 'septembre', 'octobre', 'novembre', 'décembre'),
      periode = new Array('dès 8h15/8h30', 'en début de matinée', 'en milieu de matinée', 'en fin de matinée ou début d\'après-midi', 'en début d\'après-midi', 'vers 15h30')
    if (h < 540) {
      p = 0
    } else if (h < 600) {
      p = 1
    } else if (h < 690) {
      p = 2
    } else if (h < 840) {
      p = 3
    } else if (h < 900) {
      p = 4
    } else {
      p = 5
    }
    return `${nomJour[j]} ${d} ${nomMois[m]} ${periode[p]}`
  }

  function getConfirmationMsg(e, clt, type) {
    let confirmationMsg
    if (!e.devis.hasOwnProperty('detail')) {
      confirmationMsg = `Bonjour ${clt.nom}\n\nJe vous confirme notre rendez-vous le ${getRDVDevisPeriode(e.startDate)}\n\nCordialement\n${type == 'sms' ? 'PROXIM JARDIN\n\nPour nous joindre par téléphone: 02 43 81 07 14' : ''}`
    } else if (e.contrat.hasOwnProperty('an')) {
      confirmationMsg = `Bonjour ${clt.hasOwnProperty('contact') ? `${clt.contact.nom}` : `${clt.nom}`}\n\nUne intervention est prévue ${clt.hasOwnProperty('contact') ? `chez ${clt.nom}` : ''} le ${getRDVPeriode(e.startDate)}\n\nCordialement\n${type == 'sms' ? 'PROXIM JARDIN\n\nPour nous joindre par téléphone: 02 43 81 07 14' : ''}`
    } else {
      confirmationMsg = `Bonjour ${clt.hasOwnProperty('contact') ? `${clt.contact.nom}` : `${clt.nom}`}\n\nL'intervention ${!e.devis.description[0].toLowerCase().match(/[aeiouyéè]/g) ? `de ` : `d'`}${e.devis.description.toLowerCase()} est prévue ${clt.hasOwnProperty('contact') ? `chez ${clt.nom}` : ''} le ${getRDVPeriode(e.startDate)}\n\nCordialement\n${type == 'sms' ? 'PROXIM JARDIN\n\nPour nous joindre par téléphone: 02 43 81 07 14' : ''}`
    }
    return confirmationMsg
  }


  /*date format pour confirmation de rdv aaaa/mm/dd hh:mm:ss*/
  function getRDVDevisPeriode(e) {
    let date = new Date(e),
      m = date.getMonth(),
      j = date.getDay(),
      d = date.getDate(),
      h = date.getHours(),
      mn = date.getMinutes(),
      nomJour = new Array('dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'),
      nomMois = new Array('janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', ' août', 'septembre', 'octobre', 'novembre', 'décembre')
    mn < 10 ? mn = `0${mn}` : mn
    mn == 0 ? mn = '' : mn
    return `${nomJour[j]} ${d} ${nomMois[m]} à ${h} heure ${mn}`
  }

  /*numero tel pour sms*/
  function smsNumTel(num) {
    let n = num.replace(/\s+/g, '')
    n = n.substring(1)
    n = `33${n}`
    return n
  }

  /*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~_____________________________~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  ==================================|					                    |=======================================================
  ==================================|	mise à jour data FILEMAKER	|=======================================================
  ==================================|_____________________________|=======================================================
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

  function getDataClient(val) {
    queryToFM(new queryFM('getDataClient', val, 0))
    return true
  }

  function getDataAppointmentFM(day) {
    let dayStartEnd = dateStartEndCurrentSem(day),
      dayS = dayStartEnd.dateStart,
      param = JSON.stringify(dayStartEnd)
    if (!appointmentDownloaded.includes(dayS)) {
      appointmentDownloaded.push(dayS)
      queryToFM(new queryFM('getDataAppointment', param, 0))
    }
    return true
  }

  function getDataAnnuelFM(p) {
    let param = JSON.stringify(p)
    queryToFM(new queryFM('getDataAnnuel', param, 0))
    return true
  }

  function appointementChangeFM(e) {
    let param = JSON.stringify(e)
    queryToFM(new queryFM('maj_Appointment', param, 0))
    return true
  }

  function SQL_UpdateFM(table, key, value) {
    delete value.id
    let sql_val = ''
    $.each(value, (e, val) => {
      let newVal
      if (e == 'description') {
        val = echapElem(val)
      }
      typeof val === 'string' || typeof val === 'object' ? newVal = `'${val}'` : newVal = val
      val = `${e}!!${newVal}`
      sql_val = `${sql_val}${val},`
    })
    sql_val = sql_val.substring(0, sql_val.length - 1)
    const SQL = `!E!UPDATE ${table} SET ${sql_val} WHERE id!!'${key}'`
    queryToFM(new queryFM('maj_Planning', SQL, 0))
  }

  function SQL_InsertFM(table, value) {
    let sql_val = '',
      sql_prop = Object.keys(value).join(',')
    $.each(value, (e, val) => {
      let newVal
      e == 'description' && (val = echapElem(val));
      typeof val === 'string' || typeof val === 'object' ? newVal = `'${val}'` : newVal = val
      sql_val = `${sql_val}${newVal},`
    })
    sql_val = sql_val.substring(0, sql_val.length - 1)
    const SQL = `!E!INSERT INTO ${table} (${sql_prop}) VALUES (${sql_val})`
    queryToFM(new queryFM('maj_Planning', SQL, 0))
  }

  function SQL_removeFM(table, key) {
    const SQL = `!E!DELETE FROM ${table} WHERE id!!'${key}'`
    queryToFM(new queryFM('maj_Planning', SQL, 0))
  }

  function queryToFM(query) {
    //FileMaker.PerformScript(query.script, query.param)
    FileMaker.PerformScriptWithOption(query.script, query.param, query.option)
    return true
  }

})
