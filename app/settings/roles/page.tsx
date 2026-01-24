'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { ChevronLeft, Plus, Pencil, Trash2 } from 'lucide-react'
import { Separator } from '@/components/ui/separator'

interface Role {
  id: string
  name: string
  description: string
  permissions: {
    dashboard: boolean
    drivers: boolean
    trucks: boolean
    trips: boolean
    gpsTracking: boolean
    billing: boolean
    compliance: boolean
    reports: boolean
    settings: boolean
  }
}

const defaultRoles: Role[] = [
  {
    id: 'admin',
    name: 'Admin',
    description: 'Full system access and management',
    permissions: {
      dashboard: true,
      drivers: true,
      trucks: true,
      trips: true,
      gpsTracking: true,
      billing: true,
      compliance: true,
      reports: true,
      settings: true,
    },
  },
  {
    id: 'driver',
    name: 'Driver',
    description: 'View personal trips and earnings',
    permissions: {
      dashboard: true,
      drivers: false,
      trucks: false,
      trips: true,
      gpsTracking: false,
      billing: false,
      compliance: false,
      reports: false,
      settings: false,
    },
  },
  {
    id: 'supervisor',
    name: 'Supervisor',
    description: 'View all data and generate reports',
    permissions: {
      dashboard: true,
      drivers: true,
      trucks: true,
      trips: true,
      gpsTracking: true,
      billing: true,
      compliance: true,
      reports: true,
      settings: false,
    },
  },
]

export default function RolesPage() {
  const router = useRouter()
  const [roles, setRoles] = useState<Role[]>(defaultRoles)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [isAdding, setIsAdding] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('userRoles')
    if (stored) {
      setRoles(JSON.parse(stored))
    }
  }, [])

  const saveRoles = (updatedRoles: Role[]) => {
    localStorage.setItem('userRoles', JSON.stringify(updatedRoles))
    setRoles(updatedRoles)
  }

  const handleEdit = (role: Role) => {
    setEditingRole({ ...role })
    setIsAdding(false)
  }

  const handleDelete = (roleId: string) => {
    if (roleId === 'admin') {
      alert('Cannot delete the Admin role')
      return
    }
    if (!confirm('Are you sure you want to delete this role?')) return
    
    const updated = roles.filter(r => r.id !== roleId)
    saveRoles(updated)
  }

  const handleSave = () => {
    if (!editingRole) return

    if (!editingRole.name.trim()) {
      alert('Role name is required')
      return
    }

    if (isAdding) {
      const newRole = { ...editingRole, id: Date.now().toString() }
      saveRoles([...roles, newRole])
    } else {
      const updated = roles.map(r => r.id === editingRole.id ? editingRole : r)
      saveRoles(updated)
    }

    setEditingRole(null)
    setIsAdding(false)
  }

  const handleAddNew = () => {
    setEditingRole({
      id: '',
      name: '',
      description: '',
      permissions: {
        dashboard: false,
        drivers: false,
        trucks: false,
        trips: false,
        gpsTracking: false,
        billing: false,
        compliance: false,
        reports: false,
        settings: false,
      },
    })
    setIsAdding(true)
  }

  const togglePermission = (key: keyof Role['permissions']) => {
    if (editingRole) {
      setEditingRole({
        ...editingRole,
        permissions: {
          ...editingRole.permissions,
          [key]: !editingRole.permissions[key],
        },
      })
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/settings')}
            className="hover:bg-muted"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Settings
          </Button>
        </div>

        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">User Roles & Permissions</h1>
          <p className="text-muted-foreground">Manage access levels for system users</p>
        </div>

        {editingRole ? (
          <Card>
            <CardHeader>
              <CardTitle>{isAdding ? 'Add New Role' : `Edit Role: ${editingRole.name}`}</CardTitle>
              <CardDescription>Configure role name, description, and permissions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="role-name">Role Name</Label>
                <Input
                  id="role-name"
                  value={editingRole.name}
                  onChange={(e) => setEditingRole({ ...editingRole, name: e.target.value })}
                  placeholder="e.g., Manager"
                  className="mt-2"
                  disabled={editingRole.id === 'admin' && !isAdding}
                />
              </div>

              <div>
                <Label htmlFor="role-description">Description</Label>
                <Input
                  id="role-description"
                  value={editingRole.description}
                  onChange={(e) => setEditingRole({ ...editingRole, description: e.target.value })}
                  placeholder="Brief description of this role"
                  className="mt-2"
                />
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-4">Permissions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(editingRole.permissions).map(([key, value]) => (
                    <div key={key} className="flex items-center space-x-2">
                      <Checkbox
                        id={key}
                        checked={value}
                        onCheckedChange={() => togglePermission(key as keyof Role['permissions'])}
                        disabled={editingRole.id === 'admin' && !isAdding}
                      />
                      <Label htmlFor={key} className="cursor-pointer capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleSave}>
                  {isAdding ? 'Create Role' : 'Save Changes'}
                </Button>
                <Button variant="outline" onClick={() => { setEditingRole(null); setIsAdding(false) }}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">{roles.length} roles configured</p>
              <Button onClick={handleAddNew}>
                <Plus className="h-4 w-4 mr-2" />
                Add New Role
              </Button>
            </div>

            <div className="space-y-4">
              {roles.map((role) => (
                <Card key={role.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground">{role.name}</h3>
                        <p className="text-sm text-muted-foreground">{role.description}</p>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {Object.entries(role.permissions)
                            .filter(([, enabled]) => enabled)
                            .map(([key]) => (
                              <span
                                key={key}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary"
                              >
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                              </span>
                            ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(role)}
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        {role.id !== 'admin' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(role.id)}
                            className="hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
