task :default => [ :uninstall, :clean, :build, :install ]

pwd = Dir.pwd

directory "bin"
directory "lib"
directory "/usr/local/bin"

file "node_modules"                                          do |t| sh "npm install" end
file "lib/nappy.js" => [ "lib" ]                          do |t| sh "coffee -c -o ./lib src/nappy.coffee" end
file "bin/nappy"    => [ "bin", "lib", "lib/nappy.js" ] do |t|
  sh "echo '#!/usr/bin/env node
' > bin/nappy"
    sh "cat lib/nappy.js >> bin/nappy"
    sh "chmod +x bin/nappy"
end

file "/usr/local/bin/nappy" => [ "/usr/local/bin", "bin/nappy" ] do |t|
  Dir.chdir "/usr/local/bin" do |prefix_pwd|
    sh "ln -s #{pwd}/bin/nappy"
  end
end

task :build   => [ "bin/nappy" ]
task :install => [ "/usr/local/bin/nappy" ]
task :clean   => [ :uninstall ] do |t|
  if File.exist? "./bin/nappy"    then sh "rm ./bin/nappy"    end
  if File.exist? "./lib/nappy.js" then sh "rm ./lib/nappy.js" end
end

task :uninstall                 do |t| if File.symlink? "/usr/local/bin/nappy" then sh "rm /usr/local/bin/nappy" end end

task :clean_modules  do |t| sh "rm -rf ./node_modules" end
task :nuke           => [ :clean_modules, :clean ]
task :rebuild        => [ :nuke, :build ]


