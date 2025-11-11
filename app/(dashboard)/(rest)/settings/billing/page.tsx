import React from 'react'

function BillingSettingsPage() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6">
        <div className="bg-card p-6 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Current Plan</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-medium">Enterprise Plan</p>
              <p className="text-sm text-muted-foreground">$99/month</p>
            </div>
            <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">Active</span>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">10,000</p>
              <p className="text-sm text-muted-foreground">Workflow Executions</p>
            </div>
            <div>
              <p className="text-2xl font-bold">50</p>
              <p className="text-sm text-muted-foreground">Team Members</p>
            </div>
            <div>
              <p className="text-2xl font-bold">Unlimited</p>
              <p className="text-sm text-muted-foreground">Storage</p>
            </div>
          </div>
        </div>

        <div className="bg-card p-6 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-6 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-mono">
                ****
              </div>
              <div>
                <p className="font-medium">•••• •••• •••• 4242</p>
                <p className="text-sm text-muted-foreground">Expires 12/26</p>
              </div>
            </div>
            <button className="text-sm text-muted-foreground hover:text-foreground">Update</button>
          </div>
          <button className="mt-4 px-4 py-2 border border-dashed rounded-md hover:bg-muted">
            + Add Payment Method
          </button>
        </div>

        <div className="bg-card p-6 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Billing History</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-3 border-b">
              <div>
                <p className="font-medium">November 2025</p>
                <p className="text-sm text-muted-foreground">Invoice #INV-001</p>
              </div>
              <div className="text-right">
                <p className="font-medium">$99.00</p>
                <button className="text-sm text-primary hover:underline">Download</button>
              </div>
            </div>
            <div className="flex items-center justify-between py-3 border-b">
              <div>
                <p className="font-medium">October 2025</p>
                <p className="text-sm text-muted-foreground">Invoice #INV-002</p>
              </div>
              <div className="text-right">
                <p className="font-medium">$99.00</p>
                <button className="text-sm text-primary hover:underline">Download</button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card p-6 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Usage This Month</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Workflow Executions</span>
                <span>7,250 / 10,000</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: '72.5%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Storage Used</span>
                <span>2.4 GB / Unlimited</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: '15%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BillingSettingsPage
