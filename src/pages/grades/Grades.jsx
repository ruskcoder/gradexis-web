import React from 'react'
import { useLocation } from 'react-router-dom'
import { GradesLayout } from './GradesLayout'
import { GradesView } from './GradesView'
import { WhatIf } from '@/pages/calculators/WhatIf'
import { History } from '@/pages/statistics/History'
import { TimelinePage } from '@/pages/statistics/Timeline'
import { ImpactsPage } from '@/pages/statistics/Impacts'
import { useCurrentUser } from '@/lib/store'

export default function Grades() {
  const user = useCurrentUser();
  const location = useLocation();
  const showTitle = user ? user.showPageTitles !== false : true;
  
  let element = null;
  let pageTitle = 'Grades';

  switch (location.pathname) {
    case '/grades/whatif':
      element = <WhatIf />;
      pageTitle = 'What If';
      break;
    case '/statistics/history':
      element = <History />;
      pageTitle = 'History';
      break;
    case '/statistics/timeline':
      element = <TimelinePage />;
      pageTitle = 'Timeline';
      break;
    case '/statistics/timetravel':
      element = <GradesView timeTravel={true} />;
      pageTitle = 'TimeTravel';
      break;
    case '/statistics/impacts':
      element = <ImpactsPage />;
      pageTitle = 'Impacts';
      break;
    default:
      element = <GradesView />;
      pageTitle = 'Grades';
  }

  return <GradesLayout showTitle={showTitle} pageTitle={pageTitle} element={element} />
}