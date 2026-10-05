import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

let server;
let renderDashboard;

before(async () => {
    server = await createServer({
        configFile: false,
        optimizeDeps: { noDiscovery: true, include: [] },
        plugins: [react()],
        resolve: {
            alias: {
                '@': fileURLToPath(new URL('../resources/js', import.meta.url)),
            },
        },
        server: { middlewareMode: true },
    });
    const { default: OrderDashboard } = await server.ssrLoadModule(
        '/resources/js/components/order-dashboard.tsx',
    );
    renderDashboard = (checked, markers, completed = false, details = {}) => {
        const row = {
            id: 1,
            vessel_name: 'MV Test Vessel',
            customer_name: 'Test Customer',
            port: 'Colombo',
            eta: null,
            status: completed ? 'delivered' : 'pending',
            compliance_checked: checked,
            nomination_received: checked,
            vessel_id: '1234567',
            barge_id: '8923844',
            barge_name: 'MT Assigned Barge',
            ...details.row,
        };
        return renderToStaticMarkup(
            createElement(OrderDashboard, {
                ports: ['Colombo'],
                pendingOrders: completed ? [] : [row],
                completedOrders: completed ? [row] : [],
                pendingActions: [],
                completedActions: [],
                statusMarkers: markers,
                showOperationsDetails: details.showOperationsDetails ?? false,
            }),
        );
    };
});

after(async () => {
    await server?.close();
});

function cellFor(markup, name) {
    const nameIndex = markup.indexOf(name);
    assert.notEqual(nameIndex, -1);
    const cellStart = markup.lastIndexOf('<td', nameIndex);
    return markup.slice(cellStart, markup.indexOf('</td>', nameIndex));
}

for (const checked of [true, false]) {
    for (const completed of [true, false]) {
        test(`operations icons appear in their own name cells: checked=${checked}, completed=${completed}`, () => {
            const markup = renderDashboard(
                checked,
                ['compliance', 'nomination'],
                completed,
            );
            const vesselCell = cellFor(markup, 'MV Test Vessel');
            const customerCell = cellFor(markup, 'Test Customer');
            assert.ok(vesselCell.includes(`compliance_check_${checked}.png`));
            assert.ok(!vesselCell.includes('nomination_received_'));
            assert.ok(
                customerCell.includes(`nomination_received_${checked}.png`),
            );
            assert.ok(!customerCell.includes('compliance_check_'));
            assert.ok(markup.includes('Completed Orders (last 30 days)'));
        });
    }
}

test('sales retains its compliance-only status display', () => {
    const markup = renderDashboard(true, ['compliance']);
    assert.ok(
        cellFor(markup, 'MV Test Vessel').includes('compliance_check_true.png'),
    );
    assert.ok(!markup.includes('nomination_received_'));
    assert.ok(!markup.includes('IMO 1234567'));
    assert.ok(!markup.includes('MT Assigned Barge'));
});

for (const completed of [false, true]) {
    test(`operations displays vessel IMO and assigned barge: completed=${completed}`, () => {
        const markup = renderDashboard(
            true,
            ['compliance', 'nomination'],
            completed,
            {
                showOperationsDetails: true,
            },
        );
        assert.ok(cellFor(markup, 'MV Test Vessel').includes('IMO 1234567'));
        assert.ok(
            cellFor(markup, 'MT Assigned Barge').includes('MT Assigned Barge'),
        );
        assert.ok(markup.includes('Barge'));
    });
}

test('operations handles unassigned barges and missing IMO', () => {
    const markup = renderDashboard(false, ['compliance', 'nomination'], false, {
        showOperationsDetails: true,
        row: { vessel_id: null, barge_id: null, barge_name: null },
    });
    assert.ok(!cellFor(markup, 'MV Test Vessel').includes('IMO'));
    assert.ok(!markup.includes('MT Assigned Barge'));
    assert.ok(!markup.includes('undefined'));
});

test('operations falls back to the assigned barge ID when its name is missing', () => {
    const markup = renderDashboard(true, ['compliance', 'nomination'], false, {
        showOperationsDetails: true,
        row: { barge_name: null },
    });
    assert.ok(cellFor(markup, '8923844').includes('8923844'));
});
