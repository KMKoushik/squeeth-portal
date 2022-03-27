// Add required pages - smaple available in auction page useEffect()
export enum Pages {
  auction = 'auction',
  home = 'home'
}

export enum TablePages {
  procedure = 'increment_page_view',
  procedure_param = 'page_slug',
  dbName = 'pages',
  count = 'view_count',
  col_slug = 'slug'
}

// Add actions
export enum Activity {
  succussfullAuction = 'Successful Auction',
  failedAction = 'Failed Auction'
}

export enum TableActivity {
  procedure = 'increment_activity_view',
  procedure_param = 'activity_name',
  dbName = 'activities',
  count = 'activity_count',
  col_activity = 'activity',
}


