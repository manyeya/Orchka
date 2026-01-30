import React from 'react'

function LimitsSettingsPage() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6">
        <div className="bg-card p-6 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">API Rate Limits</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Requests per minute</span>
                <span className="text-sm text-muted-foreground">850 / 1,000</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: '85%' }}></div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Resets in 12 minutes</p>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Requests per hour</span>
                <span className="text-sm text-muted-foreground">45,200 / 50,000</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-orange-500 h-2 rounded-full" style={{ width: '90.4%' }}></div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Resets in 2 hours 15 minutes</p>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Requests per day</span>
                <span className="text-sm text-muted-foreground">980,000 / 1,000,000</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '98%' }}></div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Resets in 18 hours</p>
            </div>
          </div>
        </div>

        <div className="bg-card p-6 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Resource Limits</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-3">Workflow Limits</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Active Workflows</span>
                  <span className="text-sm font-medium">23 / 50</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Workflow Steps</span>
                  <span className="text-sm font-medium">156 / 500</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Concurrent Executions</span>
                  <span className="text-sm font-medium">8 / 20</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-3">Storage Limits</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">File Storage</span>
                  <span className="text-sm font-medium">2.4 GB / 10 GB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Database Records</span>
                  <span className="text-sm font-medium">45,231 / 100,000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Log Retention</span>
                  <span className="text-sm font-medium">30 days</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card p-6 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Rate Limit Alerts</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-orange-600 text-sm">⚠️</span>
                </div>
                <div>
                  <p className="font-medium">Hourly limit approaching</p>
                  <p className="text-sm text-muted-foreground">90% of hourly API requests used</p>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">2h ago</span>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-sm">ℹ️</span>
                </div>
                <div>
                  <p className="font-medium">Daily limit reset</p>
                  <p className="text-sm text-muted-foreground">Your daily API limits have been reset</p>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">1d ago</span>
            </div>
          </div>
        </div>

        <div className="bg-card p-6 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Upgrade Options</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium">Pro Plan</h3>
              <p className="text-sm text-muted-foreground mb-2">$29/month</p>
              <ul className="text-sm space-y-1 mb-4">
                <li>• 5,000 requests/hour</li>
                <li>• 25 active workflows</li>
                <li>• 5 GB storage</li>
              </ul>
              <button className="w-full px-3 py-2 bg-primary text-primary-foreground text-sm rounded-md hover:bg-primary/90">
                Upgrade
              </button>
            </div>

            <div className="p-4 border rounded-lg">
              <h3 className="font-medium">Business Plan</h3>
              <p className="text-sm text-muted-foreground mb-2">$79/month</p>
              <ul className="text-sm space-y-1 mb-4">
                <li>• 25,000 requests/hour</li>
                <li>• 100 active workflows</li>
                <li>• 50 GB storage</li>
              </ul>
              <button className="w-full px-3 py-2 bg-primary text-primary-foreground text-sm rounded-md hover:bg-primary/90">
                Upgrade
              </button>
            </div>

            <div className="p-4 border-2 border-primary rounded-lg bg-primary/5">
              <h3 className="font-medium">Enterprise Plan</h3>
              <p className="text-sm text-muted-foreground mb-2">$99/month</p>
              <ul className="text-sm space-y-1 mb-4">
                <li>• 50,000 requests/hour</li>
                <li>• Unlimited workflows</li>
                <li>• Unlimited storage</li>
              </ul>
              <button className="w-full px-3 py-2 bg-primary text-primary-foreground text-sm rounded-md hover:bg-primary/90" disabled>
                Current Plan
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LimitsSettingsPage
