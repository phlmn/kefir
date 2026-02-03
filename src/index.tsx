import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router';

import { getPyodide } from './fir';
import { Root } from './Root';
import { BassSettingsPage } from './pages/BassSettingsPage';
import { TopsSettingsPage } from './pages/TopsSettingsPage';
import { InputsPage } from './pages/InputsPage';
import { RoutingPage } from './pages/RoutingPage';
import { HouseCurvePage } from './pages/HouseCurvePage';
import { GlobalStateProvider } from './state';
import { HomePage } from './pages/HomePage';

// preload pyodide
getPyodide();

let router = createBrowserRouter([
  {
    path: '/',
    Component: Root,
    children: [
      {
        index: true,
        Component: HomePage,
      },
      {
        path: '/bass',
        Component: BassSettingsPage,
      },
      {
        path: '/tops',
        Component: TopsSettingsPage,
      },
      {
        path: '/inputs',
        Component: InputsPage,
      },
      {
        path: '/routing',
        Component: RoutingPage,
      },
    ],
  },
]);

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement,
);
root.render(
  <GlobalStateProvider>
    <RouterProvider router={router} />
  </GlobalStateProvider>,
);
