import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router';

import { getPyodide } from './scipy';
import { Root } from './Root';
import { InputsPage } from './pages/InputsPage';
import { HouseCurvePage } from './pages/HouseCurvePage';
import { GlobalStateProvider } from './state';
import { HomePage } from './pages/HomePage';
import { OutputChannelPage } from './pages/OutputChannelPage';

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
        path: '/inputs',
        Component: InputsPage,
      },
      {
        path: '/outputs/:channel',
        Component: OutputChannelPage,
      },
      {
        path: '/housecurve',
        Component: HouseCurvePage,
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
